# Architecture: WinUI 3 C++/WinRT POS Ordering App

**Project:** vegaPOS (WinUI 3 Rewrite)
**Researched:** 2026-05-17
**Mode:** Architecture ecosystem
**Overall confidence:** HIGH — based on Microsoft official documentation, published C++/WinRT patterns, and WinUI 3 shipping APIs.

---

## Executive Summary

This document defines the architecture for the vegaPOS WinUI 3 rewrite — a restaurant Point of Sale ordering application built with C++/WinRT and the Windows App SDK. The architecture follows the MVVM (Model-View-ViewModel) pattern using WinUI 3 native XAML data binding, SQLite for local persistence, and a NavigationView-based shell for page navigation.

The key structural insight for this project is that **C++/WinRT imposes a distinct pipeline** compared to C# WinUI 3: runtime classes must be declared in MIDL 3.0 (`.idl` files), the build system generates projection headers via `midl.exe` and `cppwinrt.exe`, and developers copy stubs from `Generated Files/sources/` into the project. This is not optional — it's the framework's codegen contract.

For v1 (single ordering screen focus), the architecture deliberately keeps the project as a single Visual Studio project with folder-based separation. A future `.Core` library split is discussed but deferred.

---

## Solution Structure (v1 Prototype)

### Single Project Layout

For the v1 prototype, a single WinUI 3 project is appropriate. The project is not large enough to justify a multi-project solution (which adds complexity for project references, WinMD merging, and packaging).

```
VegaPOS.sln
└── VegaPOS/                          # WinUI 3 Desktop project (C++/WinRT)
    ├── App.xaml / App.xaml.cpp       # Application entry point, DB init
    ├── MainWindow.xaml / MainWindow.xaml.cpp  # NavigationView shell
    │
    ├── Database/                     # SQLite database layer
    │   ├── DatabaseInitializer.h/.cpp    # Creates tables on first run
    │   └── Database.h                    # Singleton connection holder
    │
    ├── Models/                       # Data models (can be plain C++ structs)
    │   ├── MenuItem.h
    │   ├── MenuCategory.h
    │   ├── CartItem.h
    │   └── Order.h
    │
    ├── Repositories/                 # SQL query wrappers
    │   ├── MenuRepository.h/.cpp
    │   └── OrderRepository.h/.cpp
    │
    ├── ViewModels/                   # Observable runtime classes (IDL + impl)
    │   ├── MenuViewModel.idl/.h/.cpp
    │   ├── CartViewModel.idl/.h/.cpp
    │   └── OrderViewModel.idl/.h/.cpp
    │
    ├── Views/                        # XAML pages (each = Page subclass)
    │   ├── OrderPage.xaml/.cpp       # Main ordering screen (v1 focus)
    │   └── BillPage.xaml/.cpp        # Basic bill view (v1 scope)
    │
    ├── Converters/                   # XAML value converters
    │   └── PriceConverter.h/.cpp     # int cents → "$12.50" string
    │
    ├── Services/                     # Business logic (platform-agnostic)
    │   ├── CartService.h/.cpp
    │   └── OrderService.h/.cpp
    │
    ├── Helpers/                      # Utility classes
    │   └── ObservableBase.h          # INotifyPropertyChanged base class
    │
    ├── Generated Files/              # DO NOT EDIT — cppwinrt.exe output
    │   └── sources/                  #  (stubs to copy, not modify in place)
    │
    ├── pch.h                        # Precompiled header
    └── VegaPOS.vcxproj
```

### Future Multi-Project Split (Post-v1)

When the app grows beyond ordering, extract a `.Core` class library:

```
VegaPOS.sln
├── VegaPOS.Core/                    # Class library (no Windows dependency)
│   ├── Models/
│   ├── Repositories/
│   ├── Services/
│   └── ViewModels/ (IDL only)
│
└── VegaPOS/                         # WinUI 3 project
    ├── Views/
    ├── Converters/
    ├── App.xaml
    └── MainWindow.xaml
```

**Why deferred:** C++/WinRT class libraries require separate WinMD merging and complicate the build pipeline. For a v1 prototype with ~3 ViewModels, the overhead is not justified. See [Windows App SDK docs on class libraries](https://learn.microsoft.com/en-us/windows/apps/winui/winui3/create-your-first-winui3-app#add-a-winui-3-class-library).

---

## MVVM Layers with C++/WinRT Specifics

### Layer Diagram

```
┌─────────────────────────────────────────────────┐
│                   XAML VIEW                      │
│  OrderPage.xaml  (Page + XAML controls)         │
│  {x:Bind ViewModel.Property, Mode=OneWay}        │
│  {x:Bind ViewModel.Command}                      │
└──────────────────────┬──────────────────────────┘
                       │ data binding (compiled)
┌──────────────────────▼──────────────────────────┐
│                   VIEWMODEL                      │
│  MenuViewModel.idl  →  MenuViewModel.h/.cpp      │
│  Implements INotifyPropertyChanged               │
│  Exposes: observable vector<MenuItem>, commands  │
└──────────────────────┬──────────────────────────┘
                       │ async calls
┌──────────────────────▼──────────────────────────┐
│                   SERVICE                        │
│  CartService  (business logic, validation)       │
│  OrderService (order placement rules)            │
└──────────────────────┬──────────────────────────┘
                       │ calls
┌──────────────────────▼──────────────────────────┐
│                   REPOSITORY                     │
│  MenuRepository  (SQL queries)                   │
│  OrderRepository (SQL queries)                   │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│                   SQLite                         │
│  Database Initializer  →  vega.db               │
└─────────────────────────────────────────────────┘
```

### Model Layer (Plain C++ structs)

Data models can be **plain C++ structs or classes** — they do NOT need to be runtime classes (no IDL declaration) because they are consumed only by ViewModels and Repositories, never bound directly from XAML.

**Rules** (from [Microsoft docs on C++/WinRT](https://learn.microsoft.com/en-us/windows/uwp/cpp-and-winrt-apis/binding-property)):
- If it's bound in XAML → must be a **runtime class** (declared in `.idl`)
- If it's consumed only by C++ code → can be a **plain C++ struct/class**
- Data models (Model layer) → plain C++
- ViewModels (ViewModel layer) → runtime classes

```cpp
// Models/MenuItem.h — plain C++ struct, no IDL needed
#pragma once
#include <string>

namespace vegaPOS::Models
{
    struct MenuItem
    {
        int id;
        int categoryId;
        std::wstring name;
        std::wstring description;
        int priceCents;        // stored as cents to avoid floating point
        bool isAvailable;
        // ... modifier groups, photos, etc.
    };
}
```

### ViewModel Layer (Runtime Classes with IDL)

ViewModels must be declared in **MIDL 3.0** (`.idl` files). The build system generates:
1. `.winmd` (Windows Metadata)
2. Projection headers in `Generated Files/sources/`
3. Stub `.h` and `.cpp` files that you copy into the project

**This is the key C++/WinRT workflow:**

```idl
// ViewModels/MenuViewModel.idl
namespace VegaPOS.ViewModels
{
    runtimeclass MenuViewModel : Microsoft.UI.Xaml.Data.INotifyPropertyChanged
    {
        MenuViewModel();
        
        // Observable collection of menu items
        Windows.Foundation.Collections.IObservableVector<Object> MenuItems { get; };
        
        // Selected category filter
        String SelectedCategory { get; set; };
    }
}
```

**Critical detail for collection binding** (from [Microsoft binding-collection docs](https://learn.microsoft.com/en-us/windows/uwp/cpp-and-winrt-apis/binding-collection)):
- Collection property type must be `IObservableVector<Object>` (not `IObservableVector<MenuItem>`)
- WinUI 3 XAML `{x:Bind}` with `ItemsSource` requires this specific type
- Use `winrt::single_threaded_observable_vector<winrt::Windows::Foundation::IInspectable>()`
- Wrap items: `vector.Append(winrt::box_value(item))`

```cpp
// ViewModels/MenuViewModel.h (after copying from Generated Files/sources/)
#pragma once
#include "MenuViewModel.g.h"
#include "../Helpers/ObservableBase.h"

namespace winrt::VegaPOS::ViewModels::implementation
{
    struct MenuViewModel : MenuViewModelT<MenuViewModel>
    {
        MenuViewModel() = default;

        // INotifyPropertyChanged via ObservableBase pattern
        winrt::event_token PropertyChanged(
            Microsoft::UI::Xaml::Data::PropertyChangedEventHandler const& handler);
        void PropertyChanged(winrt::event_token const& token);

        // Collection (observable vector)
        Windows::Foundation::Collections::IObservableVector<Windows::Foundation::IInspectable> MenuItems();
        void MenuItems(
            Windows::Foundation::Collections::IObservableVector<Windows::Foundation::IInspectable> const& value);

        // Observable property
        winrt::hstring SelectedCategory();
        void SelectedCategory(winrt::hstring const& value);

    private:
        winrt::hstring m_selectedCategory;
        Windows::Foundation::Collections::IObservableVector<Windows::Foundation::IInspectable> m_menuItems{ nullptr };
        winrt::event<Microsoft::UI::Xaml::Data::PropertyChangedEventHandler> m_propertyChanged;
        
        void RaisePropertyChanged(winrt::hstring const& propertyName);
    };
}
```

### View Layer (XAML Pages)

Each View is a **Page** subclass that binds to its ViewModel via `{x:Bind}`.

**Key rules for C++/WinRT XAML binding** (from [Microsoft data-binding docs](https://learn.microsoft.com/en-us/windows/apps/develop/data-binding/data-binding-in-depth)):

1. **Use `{x:Bind}` over `{Binding}`** — compiled binding, better performance, compile-time validation
2. **All binding sources must be exposed via properties in IDL** — the XAML compiler reads from WinMD
3. **Named XAML elements referenced in bindings must have IDL properties**
4. **Mode=OneWay** for observable properties (default is OneTime)
5. **Inside DataTemplates**, set `x:DataType` to enable compiled bindings

```xml
<!-- Views/OrderPage.xaml -->
<Page
    x:Class="VegaPOS.Views.OrderPage"
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    xmlns:local="using:VegaPOS.ViewModels">

    <Grid>
        <!-- Category filter -->
        <ListView ItemsSource="{x:Bind ViewModel.Categories, Mode=OneWay}"
                  SelectedItem="{x:Bind ViewModel.SelectedCategory, Mode=TwoWay}"/>

        <!-- Menu items grid -->
        <GridView ItemsSource="{x:Bind ViewModel.MenuItems, Mode=OneWay}">
            <GridView.ItemTemplate>
                <DataTemplate x:DataType="local:MenuItemViewModel">
                    <StackPanel>
                        <TextBlock Text="{x:Bind Name}"/>
                        <TextBlock Text="{x:Bind Price}"/>
                    </StackPanel>
                </DataTemplate>
            </GridView.ItemTemplate>
        </GridView>

        <!-- Cart panel -->
        <ListView ItemsSource="{x:Bind ViewModel.CartItems, Mode=OneWay}"/>
    </Grid>
</Page>
```

**Page.h must declare ViewModel property in IDL:**

```idl
// Views/OrderPage.idl
import "../ViewModels/MenuViewModel.idl";

namespace VegaPOS.Views
{
    runtimeclass OrderPage : Microsoft.UI.Xaml.Controls.Page
    {
        OrderPage();
        VegaPOS.ViewModels.MenuViewModel ViewModel { get; };
    }
}
```

---

## C++/WinRT Build Pipeline

This is the single most important architectural detail for a C++/WinRT project. The build system is **codegen-driven**, not purely compiled:

```
1. You write .idl files     → Declaration of runtime classes
2. midl.exe compiles .idl   → .winmd (Windows Metadata) files
3. cppwinrt.exe reads .winmd → Generates:
     ├── .h / .cpp projection headers (consumption)
     └── .h / .cpp stub files (authoring) in Generated Files/sources/
4. You copy stubs → .h / .cpp for each runtime class
5. You implement the stubs  → Add your logic
6. MSBuild compiles all     → .cpp + generated headers = .exe
```

**Practical workflow for each new runtime class:**

1. Add `.idl` file (e.g., `MenuViewModel.idl`)
2. Build (will fail — expected)
3. Navigate to `Generated Files/sources/`
4. Copy `MenuViewModel.h` and `MenuViewModel.cpp` to `ViewModels/`
5. Include them in the project (Show All Files → Include In Project)
6. Remove `static_assert` from both files
7. Implement your logic
8. Build succeeds

**Source:** [Microsoft: XAML controls; bind to a C++/WinRT property](https://learn.microsoft.com/en-us/windows/uwp/cpp-and-winrt-apis/binding-property)

---

## SQLite Database Layer

### Approach: Raw C API via sqlite3.h

For C++/WinRT, the recommended approach is using the **SQLite C API** directly (bundled via NuGet or vcpkg). Unlike C#, there is no `Microsoft.Data.Sqlite` for C++ — the C API is the supported path.

**Package:** `sqlite3` via vcpkg or NuGet (`Microsoft.Windows.CppWinRT` doesn't include SQLite).

### Database Schema (v1)

```sql
-- Tables for the ordering prototype

CREATE TABLE menu_categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_visible  INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE menu_items (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id   INTEGER NOT NULL REFERENCES menu_categories(id),
    name          TEXT NOT NULL,
    description   TEXT DEFAULT '',
    price_cents   INTEGER NOT NULL,   -- $12.50 = 1250
    is_available  INTEGER NOT NULL DEFAULT 1,
    sort_order    INTEGER NOT NULL DEFAULT 0,
    photo_path    TEXT DEFAULT ''
);

CREATE TABLE orders (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number    TEXT NOT NULL UNIQUE,
    created_at      TEXT NOT NULL,   -- ISO 8601
    status          TEXT NOT NULL DEFAULT 'open',  -- open | placed | paid
    total_cents     INTEGER NOT NULL DEFAULT 0,
    tax_cents       INTEGER NOT NULL DEFAULT 0,
    service_charge_cents INTEGER NOT NULL DEFAULT 0,
    special_notes   TEXT DEFAULT ''
);

CREATE TABLE order_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id    INTEGER NOT NULL REFERENCES orders(id),
    item_name   TEXT NOT NULL,
    item_id     INTEGER,            -- nullable: menu item may be deleted later
    quantity    INTEGER NOT NULL DEFAULT 1,
    unit_price_cents INTEGER NOT NULL,
    modifiers   TEXT DEFAULT '[]',   -- JSON array of modifier objects
    notes       TEXT DEFAULT ''
);
```

### Database Access Pattern

```cpp
// Database/Database.h
#pragma once
#include <sqlite3.h>
#include <string>

namespace vegaPOS::Data
{
    class Database
    {
    public:
        static Database& Instance();
        
        bool Initialize(const std::wstring& dbPath);
        sqlite3* Handle() const { return m_db; }
        
        ~Database();
        
        // Prevent copy/move
        Database(const Database&) = delete;
        Database& operator=(const Database&) = delete;

    private:
        Database() = default;
        sqlite3* m_db = nullptr;
    };
}
```

**Database initialization in App.xaml.cpp:**

```cpp
// App.xaml.cpp
#include "Database/Database.h"
#include "Database/DatabaseInitializer.h"

namespace winrt::VegaPOS::implementation
{
    void App::OnLaunched(LaunchActivatedEventArgs const&)
    {
        // Get local app data folder
        auto localFolder = Windows::Storage::ApplicationData::Current().LocalFolder();
        auto dbPath = localFolder.Path() + L"\\vega.db";
        
        // Initialize database (creates tables if not exist)
        auto& db = Data::Database::Instance();
        db.Initialize(dbPath.c_str());
        Data::DatabaseInitializer::EnsureTables();
        
        // Create main window
        window = make<MainWindow>();
        window.Activate();
    }
}
```

### Repository Pattern

Repositories abstract SQL queries behind C++ interfaces. They are plain C++ classes (no IDL needed).

```cpp
// Repositories/MenuRepository.h
#pragma once
#include "../Models/MenuItem.h"
#include "../Models/MenuCategory.h"
#include <vector>

namespace vegaPOS::Data
{
    class MenuRepository
    {
    public:
        std::vector<Models::MenuItem> GetItemsByCategory(int categoryId);
        std::vector<Models::MenuCategory> GetAllCategories();
        Models::MenuItem GetItemById(int id);
        
        // Future: CRUD operations
    };
}
```

### Why Not Entity Framework / ORM?

- No C++ ORM for SQLite has the maturity of Entity Framework for C#
- Raw SQLite C API gives full control, minimal overhead
- SQL queries for a POS ordering system are simple (single-table reads/writes)
- A thin C++ wrapper over `sqlite3_*` functions is sufficient for v1
- **Source:** [SQLite C/C++ Interface](https://sqlite.org/cintro.html)

---

## WinUI 3 Navigation Pattern

### NavigationView + Frame Navigation

The navigation shell uses **NavigationView** with **Frame** for page content:

```xml
<!-- MainWindow.xaml -->
<NavigationView x:Name="NavView"
                PaneDisplayMode="Left"
                ItemInvoked="OnNavItemInvoked"
                Loaded="OnNavLoaded">
    <NavigationView.MenuItems>
        <NavigationViewItem Tag="order" Icon="Shop" Content="New Order"/>
        <NavigationViewItem Tag="bill" Icon="Receipt" Content="Bills"/>
    </NavigationView.MenuItems>

    <Frame x:Name="ContentFrame"/>
</NavigationView>
```

**Navigation logic:**

```cpp
// MainWindow.cpp
void MainWindow::OnNavItemInvoked(
    winrt::Microsoft::UI::Xaml::Controls::NavigationView const&,
    winrt::Microsoft::UI::Xaml::Controls::NavigationViewItemInvokedEventArgs const& args)
{
    auto tag = winrt::unbox_value<winrt::hstring>(args.InvokedItemContainer().Tag());
    
    Windows::UI::Xaml::Interop::TypeName pageType;
    
    if (tag == L"order")
        pageType = winrt::xaml_typename<VegaPOS::Views::OrderPage>();
    else if (tag == L"bill")
        pageType = winrt::xaml_typename<VegaPOS::Views::BillPage>();
    else
        return;
    
    ContentFrame().Navigate(pageType, nullptr);
}
```

**For v1 (single ordering screen focus):** The navigation structure is minimal — the app may not even need NavigationView initially. A single `OrderPage` as the window content simplifies v1. NavigationView becomes relevant when BillPage and other screens are added.

**Key NavigationView decisions:**
- `PaneDisplayMode="Left"` — standard desktop layout, POS users expect persistent navigation
- No top navigation — POS apps have few top-level screens (< 5)
- Footer items for Settings (future)
- Tags store page type identifiers (more maintainable than magic strings)

**Source:** [NavigationView docs (Microsoft)](https://learn.microsoft.com/en-us/windows/apps/develop/ui/controls/navigationview), C++/WinRT code sample included.

---

## Data Binding Patterns for C++/WinRT

### Observable Property Pattern

Every observable property in a ViewModel follows this exact pattern:

```cpp
// In .idl:
runtimeclass CartViewModel : Microsoft.UI.Xaml.Data.INotifyPropertyChanged
{
    // ...
    Int32 ItemCount { get; set; };
}

// In .h (implementation):
struct CartViewModel : CartViewModelT<CartViewModel>
{
    // ...
    int32_t ItemCount();
    void ItemCount(int32_t value);
    
private:
    int32_t m_itemCount = 0;
    winrt::event<Microsoft::UI::Xaml::Data::PropertyChangedEventHandler> m_propertyChanged;
    
    void RaisePropertyChanged(winrt::hstring const& name)
    {
        m_propertyChanged(*this, 
            Microsoft::UI::Xaml::Data::PropertyChangedEventArgs(name));
    }
};

// In .cpp:
int32_t CartViewModel::ItemCount()
{
    return m_itemCount;
}

void CartViewModel::ItemCount(int32_t value)
{
    if (m_itemCount != value)
    {
        m_itemCount = value;
        RaisePropertyChanged(L"ItemCount");
    }
}
```

### Observable Collection Pattern

```cpp
// In .idl:
runtimeclass OrderViewModel : Microsoft.UI.Xaml.Data.INotifyPropertyChanged
{
    // ...
    Windows.Foundation.Collections.IObservableVector<Object> CartItems { get; };
}

// In .h:
Windows::Foundation::Collections::IObservableVector<Windows::Foundation::IInspectable> CartItems();
void CartItems(Windows::Foundation::Collections::IObservableVector<Windows::Foundation::IInspectable> const& value);

// In .cpp (constructor):
m_cartItems = winrt::single_threaded_observable_vector<Windows::Foundation::IInspectable>();
// ... or in the header initializer
```

### Boolean Visibility Binding

Convert `bool` to `Visibility` for UI visibility toggles:

```xml
<TextBlock Visibility="{x:Bind ViewModel.HasItems, Mode=OneWay, Converter={StaticResource BoolToVisibilityConverter}}"/>
```

```cpp
// Converters/BoolToVisibilityConverter.h
struct BoolToVisibilityConverter : winrt::implements<
    BoolToVisibilityConverter,
    Microsoft::UI::Xaml::Data::IValueConverter>
{
    Windows::Foundation::IInspectable Convert(
        Windows::Foundation::IInspectable const& value,
        Windows::UI::Xaml::Interop::TypeName const& targetType,
        Windows::Foundation::IInspectable const& parameter,
        winrt::hstring const& language);
    
    Windows::Foundation::IInspectable ConvertBack(
        Windows::Foundation::IInspectable const& value,
        Windows::UI::Xaml::Interop::TypeName const& targetType,
        Windows::Foundation::IInspectable const& parameter,
        winrt::hstring const& language);
};
```

### Binding Rules Summary

| Aspect | C++/WinRT Rule | Source |
|--------|---------------|--------|
| `{x:Bind}` | Preferred. Compile-time checked. No `[Bindable]` needed | [MS Docs](https://learn.microsoft.com/en-us/windows/apps/develop/data-binding/data-binding-in-depth) |
| `{Binding}` | Requires `[Bindable]` attr or `ICustomPropertyProvider` | [MS Docs](https://learn.microsoft.com/en-us/windows/uwp/cpp-and-winrt-apis/binding-property) |
| Collection binding | Must use `IObservableVector<IInspectable>` | [MS Docs](https://learn.microsoft.com/en-us/windows/uwp/cpp-and-winrt-apis/binding-collection) |
| Runtime class IDL | All ViewModels must be declared in `.idl` | [MS Docs](https://learn.microsoft.com/en-us/windows/uwp/cpp-and-winrt-apis/binding-property) |
| Data model binding | Only if bound from XAML — otherwise plain C++ | [MS Docs](https://learn.microsoft.com/en-us/windows/uwp/cpp-and-winrt-apis/binding-property) |
| Mode default | `{x:Bind}` defaults to OneTime; set Mode=OneWay/TwoWay explicitly | [MS Docs](https://learn.microsoft.com/en-us/windows/apps/develop/data-binding/data-binding-in-depth) |
| Named elements in binding | Must have IDL read-only property | [MS Docs](https://learn.microsoft.com/en-us/windows/uwp/cpp-and-winrt-apis/binding-property) |

---

## Error Handling Pattern

### Three-Layer Strategy

**Layer 1 — Repository (SQLite errors):**
```cpp
// Repositories/MenuRepository.cpp
std::vector<Models::MenuItem> MenuRepository::GetItemsByCategory(int categoryId)
{
    std::vector<Models::MenuItem> items;
    sqlite3_stmt* stmt = nullptr;
    
    const char* sql = "SELECT id, category_id, name, description, price_cents, is_available "
                       "FROM menu_items WHERE category_id = ? AND is_available = 1 "
                       "ORDER BY sort_order";
    
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) != SQLITE_OK)
    {
        throw std::runtime_error("Failed to prepare query: " + 
                                 std::string(sqlite3_errmsg(db)));
    }
    
    sqlite3_bind_int(stmt, 1, categoryId);
    
    while (sqlite3_step(stmt) == SQLITE_ROW)
    {
        // ... populate items
    }
    
    sqlite3_finalize(stmt);
    return items;
}
```

**Layer 2 — ViewModel (domain errors, surfaces to View):**
```cpp
// ViewModels/MenuViewModel.cpp (simplified)
void MenuViewModel::LoadMenuItems()
{
    try {
        auto repo = Data::MenuRepository();
        auto items = repo.GetItemsByCategory(m_selectedCategory);
        
        m_menuItems.Clear();
        for (auto& item : items)
        {
            auto vm = winrt::make<implementation::MenuItemViewModel>(item);
            m_menuItems.Append(winrt::box_value(vm));
        }
    }
    catch (const std::exception& ex)
    {
        // Set error property for UI binding
        ErrorMessage(winrt::to_hstring(ex.what()));
        // Log
        OutputDebugStringA(ex.what());
    }
}
```

**Layer 3 — View (user-facing):**
```xml
<!-- Show error banner when ErrorMessage is not empty -->
<InfoBar x:Name="ErrorBanner"
         IsOpen="{x:Bind ViewModel.HasError, Mode=OneWay}"
         Message="{x:Bind ViewModel.ErrorMessage, Mode=OneWay}"
         Severity="Error"/>
```

### Key Rules for WinUI 3 Error Handling

1. **Never let exceptions escape to XAML event handlers** — they crash the app
2. **Use try/catch in all event handlers and async callbacks** — this is critical for C++/WinRT
3. **Surface errors through observable properties** — ViewModel sets `ErrorMessage`, View binds
4. **Log via `OutputDebugString`** for development, structured logging for production (post-v1)
5. **Database errors are fatal at init** (corrupt DB) but recoverable at query level

### WinUI 3 Threading Note

- SQLite operations run on the UI thread by default for v1 simplicity
- If queries become slow, use `winrt::Windows::System::Threading::ThreadPoolTimer` or `co_await winrt::resume_background()`
- But **all UI updates must dispatch to the UI thread** via `winrt::Windows::ApplicationModel::Core::CoreApplication::MainView().Dispatcher().RunAsync()`
- **Source:** [C++/WinRT threading](https://learn.microsoft.com/en-us/windows/uwp/cpp-and-winrt-apis/concurrency)

---

## Data Flow: Complete Order-Placement Path

This traces a complete user action through the architecture:

```
1. User taps menu item in OrderPage.xaml
   │
2. OrderPage.xaml event handler calls cartViewModel.AddItem(itemId)
   │   (event handler bound via {x:Bind} or code-behind)
   ▼
3. CartViewModel.AddItem()
   │   - Creates CartItem model
   │   - Appends to observable m_cartItems
   │   - Updates ItemCount, TotalPrice properties
   │   - Raises PropertyChanged events
   ▼
4. XAML binding updates automatically
   │   - Cart ListView shows new item
   │   - Total display updates
   │   - Badge count updates
   ▼
5. User taps "Place Order"
   │
6. OrderViewModel.PlaceOrder()
   │   - Validates cart not empty
   │   - Calls OrderRepository.InsertOrder(order, items)
   ▼
7. OrderRepository.InsertOrder()
   │   - BEGIN TRANSACTION
   │   - INSERT INTO orders
   │   - INSERT INTO order_items (loop)
   │   - COMMIT
   ▼
8. OrderViewModel receives order number
   │   - Sets PlacedOrderNumber property
   │   - Clears cart
   ▼
9. XAML binding updates
   │   - Order confirmation displayed
   │   - Cart cleared
   ▼
10. Optionally: Navigate to BillPage with order ID
```

---

## Component Boundaries

| Component | Responsibility | Depends On | Consumed By |
|-----------|---------------|-----------|-------------|
| **Database** | Connection lifecycle, table creation | sqlite3.h | Repositories |
| **MenuRepository** | Menu items CRUD queries | Database | MenuViewModel |
| **OrderRepository** | Orders + items insert/query | Database | OrderViewModel |
| **MenuViewModel** | Menu browsing state, category filter | MenuRepository, MenuItem model | OrderPage.xaml |
| **CartViewModel** | Cart items, totals, add/remove | CartItem model | OrderPage.xaml |
| **OrderViewModel** | Place order, order status | CartViewModel, OrderRepository | OrderPage.xaml |
| **CartService** | Validation (empty cart, duplicate handling, modifier logic) | CartItem model | CartViewModel |
| **OrderService** | Order placement rules, tax calculation | Order model | OrderViewModel |
| **OrderPage** | Layout, user interaction, binding | MenuViewModel, CartViewModel, OrderViewModel | MainWindow (via Frame) |
| **BillPage** | Receipt display | OrderViewModel | MainWindow (via Frame) |
| **MainWindow** | Navigation shell | Frame, NavigationView | App |

### Dependency Direction

```
View → ViewModel → Service → Repository → Database → SQLite
  │        │           │           │
  │        │           │           └── No dependency on UI
  │        │           └── Pure logic, testable without UI
  │        └── Observable runtime class, depends on WinRT
  └── XAML, depends on WinUI
```

**Each layer depends only on the layer below it.** This is the MVVM principle.

---

## Testing Strategy

### What to Test

| Component | Testable? | Approach | Tooling |
|-----------|-----------|----------|---------|
| Models (plain C++ structs) | YES | Unit test | Microsoft C++ Unit Test Framework / Google Test |
| Repositories | YES | In-memory SQLite | Use `:memory:` connection |
| Services (CartService, OrderService) | YES | Constructor-injected repositories | Microsoft C++ Unit Test Framework |
| ViewModels | PARTIAL | Test property changes, collection mutations | Requires WinRT activation (can test in-process) |
| Views (XAML) | LIMITED | Manual testing, visual validation | WinAppDriver (post-v1) |

### Repository Testing with In-Memory SQLite

```cpp
// In a test project:
TEST_CLASS(MenuRepositoryTests)
{
    TEST_METHOD(GetItemsByCategory_ReturnsItems)
    {
        // Arrange: Set up in-memory database
        Database::Instance().Initialize(L":memory:");
        DatabaseInitializer::EnsureTables();
        
        // Seed data...
        
        // Act
        MenuRepository repo;
        auto items = repo.GetItemsByCategory(1);
        
        // Assert
        Assert::AreEqual(3, (int)items.size());
    }
};
```

### ViewModel Testing Challenges

C++/WinRT ViewModels require the WinRT runtime to be initialized. For v1:
- Test business logic in Services (which are plain C++)
- Test Repositories with in-memory SQLite
- Manual test the XAML binding layer
- Post-v1: Investigate `Microsoft.UI.Xaml.Testing` APIs for UI automation

---

## Build Order Implications for Phases

The architecture imposes a strict build order. Each phase must complete its dependencies before the next begins:

```
Phase 1: Project scaffolding
  └─ Creates VegaPOS.sln, VegaPOS.vcxproj, pch.h, NuGet packages
  
Phase 2: Database infrastructure
  └─ Database.h, DatabaseInitializer.h/.cpp
  └─ sqlite3 NuGet package integration
  └─ Schema SQL files
  └─ Can test: in-memory SQLite connection works
  
Phase 3: Models layer
  └─ MenuItem.h, MenuCategory.h, CartItem.h, Order.h
  └─ Plain C++ structs, no IDL needed
  └─ Can test: model construction and serialization

Phase 4: Repositories layer
  └─ MenuRepository.h/.cpp, OrderRepository.h/.cpp
  └─ Requires: Phase 2 (Database), Phase 3 (Models)
  └─ Can test: with in-memory SQLite

Phase 5: Services layer
  └─ CartService.h/.cpp, OrderService.h/.cpp
  └─ Requires: Phase 3 (Models)
  └─ Can test: pure logic with mock repositories

Phase 6: ViewModels layer
  └─ MenuViewModel.idl/.h/.cpp
  └─ CartViewModel.idl/.h/.cpp
  └─ OrderViewModel.idl/.h/.cpp
  └─ ObservableBase.h helper
  └─ Requires: Phase 4 (Repositories), Phase 5 (Services)
  └─ C++/WinRT IDL pipeline established here
  └─ Can test: property changes observable
  
Phase 7: Views layer
  └─ OrderPage.xaml/.h/.cpp
  └─ BillPage.xaml/.h/.cpp
  └─ Converters (PriceConverter etc.)
  └─ Requires: Phase 6 (ViewModels)
  └─ Manual testing: visual layout, binding correctness
  
Phase 8: Navigation shell
  └─ MainWindow.xaml with NavigationView
  └─ Frame-based page navigation
  └─ Requires: Phase 7 (Views)
  
Phase 9: Integration & polish
  └─ End-to-end order flow
  └─ Error handling refinement
  └─ Edge cases (empty categories, order placement failures)
```

**Critical dependency:** Phase 6 (ViewModels) cannot start until the C++/WinRT IDL pipeline is validated. If midl.exe or cppwinrt.exe have issues in the project configuration, all ViewModel work is blocked. This should be validated early (Phase 1+2) with a "Hello World" runtime class.

---

## Key Architectural Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| C++/WinRT build pipeline complexity | Developer velocity slowed by codegen issues | Validate IDL pipeline in Phase 1; document the exact copy-stubs workflow |
| SQLite C API boilerplate | Verbose error handling per query | Create a helper `QueryBuilder` class (post-v1); for v1, accept verbosity for clarity |
| XAML designer issues with C++ | No live XAML preview in Visual Studio | Manual XAML authoring; use WinUI 3 Gallery as reference |
| `{x:Bind}` with DataTemplates | `x:DataType` must match the boxed type exactly | Test data templates early; ensure ViewModel items are correctly typed |
| Asynchronous data loading | UI thread blocking on SQL queries | For v1, synchronous queries are fast enough (<1K menu items); defer async to post-v1 |
| WinAppSDK versioning | Breaking changes between versions | Pin to a specific Windows App SDK version; test upgrades explicitly |

---

## Sources

| Source | Type | Confidence |
|--------|------|------------|
| [XAML controls; bind to a C++/WinRT property](https://learn.microsoft.com/en-us/windows/uwp/cpp-and-winrt-apis/binding-property) | Microsoft Docs | HIGH — official, with code examples |
| [XAML items controls; bind to a C++/WinRT collection](https://learn.microsoft.com/en-us/windows/uwp/cpp-and-winrt-apis/binding-collection) | Microsoft Docs | HIGH — official, collection binding specifics |
| [Windows data binding in depth](https://learn.microsoft.com/en-us/windows/apps/develop/data-binding/data-binding-in-depth) | Microsoft Docs | HIGH — covers {x:Bind} vs {Binding}, converters, commands |
| [NavigationView control](https://learn.microsoft.com/en-us/windows/apps/develop/ui/controls/navigationview) | Microsoft Docs | HIGH — includes C++/WinRT code sample |
| [SQLite C/C++ Interface](https://sqlite.org/cintro.html) | SQLite.org | HIGH — official C API reference |
| [WinUI 3 overview](https://learn.microsoft.com/en-us/windows/apps/winui/winui3/) | Microsoft Docs | HIGH — framework capabilities and constraints |
| [MVVM pattern (Avalonia docs, applies to XAML in general)](https://docs.avaloniaui.net/docs/fundamentals/the-mvvm-pattern) | Avalonia Docs | MEDIUM — MVVM is framework-agnostic; XAML binding behavior is shared |
| [Create your first WinUI 3 app](https://learn.microsoft.com/en-us/windows/apps/get-started/start-here) | Microsoft Docs | HIGH — environment setup, project templates |
| [Author APIs with C++/WinRT](https://learn.microsoft.com/en-us/windows/uwp/cpp-and-winrt-apis/author-apis) | Microsoft Docs | HIGH — IDL declaration rules, uniform construction |

---

## Anti-Patterns to Avoid

### 1. Skipping IDL Declaration
**What:** Adding properties to a ViewModel's `.h` file without declaring them in `.idl`
**Why it fails:** XAML compiler reads from WinMD (generated from .idl), not from .h files
**Instead:** Always add properties to `.idl` first, then build, then implement in `.h/.cpp`

### 2. Mixing Model and ViewModel
**What:** Binding a XAML control directly to a `MenuItem` plain C++ struct
**Why it fails:** Plain C++ structs do not appear in WinMD, so `{x:Bind}` cannot resolve their properties
**Instead:** Create a `MenuItemViewModel` runtime class that wraps the model

### 3. Using {Binding} Without [Bindable]
**What:** Using `{Binding}` markup extension without the `[Bindable]` attribute on the class
**Why it fails:** C++/WinRT requires `[Bindable]` or `ICustomPropertyProvider` for `{Binding}` to work
**Instead:** Use `{x:Bind}` (preferred) or add `[Microsoft.UI.Xaml.Data.Bindable]` to the IDL

### 4. Ignoring the Codegen Pipeline
**What:** Editing files in `Generated Files/sources/` directly
**Why it fails:** These files are regenerated on every build — changes are lost
**Instead:** Copy stubs to the project folder, include them, edit the copies

### 5. One ViewModel Per Page (Over-Isolation)
**What:** Creating a separate ViewModel for every tiny UI fragment
**Why it's wrong:** Leads to excessive boilerplate (each VM needs IDL, .h, .cpp)
**Instead:** Group related state — `CartViewModel` handles cart items AND totals AND count, not three separate VMs

### 6. Putting DB Access in ViewModels
**What:** Calling `sqlite3_*` directly from a ViewModel
**Why it's wrong:** Makes testing impossible, couples business logic to data access
**Instead:** Always go through Repository layer

---

## Appendix: Key C++/WinRT Types Reference

| WinRT Type | C++ Projection | Usage |
|------------|---------------|-------|
| `IVector<T>` | `winrt::Windows::Foundation::Collections::IVector<T>` | Read/write collection |
| `IObservableVector<T>` | `winrt::Windows::Foundation::Collections::IObservableVector<T>` | Observable collection for binding |
| `INotifyPropertyChanged` | `winrt::Microsoft::UI::Xaml::Data::INotifyPropertyChanged` | Observable property pattern |
| `ICommand` | `winrt::Microsoft::UI::Xaml::Input::ICommand` | Command binding |
| `hstring` | `winrt::hstring` | WinRT string type (UTF-16) |
| `IInspectable` | `winrt::Windows::Foundation::IInspectable` | Base interface, used with `box_value` |
| `event` | `winrt::event<Delegate>` | Event storage for PropertyChanged |
| `make<T>` | `winrt::make<implementation::T>()` | Create runtime class instance |
| `single_threaded_observable_vector` | `winrt::single_threaded_observable_vector<T>()` | Create observable collection |
| `box_value` | `winrt::box_value(value)` | Wrap value type as IInspectable |
| `unbox_value<T>` | `winrt::unbox_value<T>(inspectable)` | Unwrap IInspectable to value type |
| `xaml_typename<T>` | `winrt::xaml_typename<T>()` | Get TypeName for Frame.Navigate |
