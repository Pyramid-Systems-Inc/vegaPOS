# Technology Stack

**Project:** vegaPOS — WinUI 3 Rewrite (Ordering Subsystem)
**Researched:** 2026-05-17
**Overall Confidence:** HIGH (verified against official Microsoft docs, GitHub releases, NuGet packages, and community discussions)

---

## Principled Stack Decisions

This document prescribes a specific stack, not a menu of options. Each choice is justified by: (a) what the Microsoft ecosystem officially supports for WinUI 3 C++/WinRT, (b) what works reliably for a restaurant POS ordering workflow, and (c) what avoids known dead ends.

**Overarching constraint:** Microsoft's official WinUI 3 tooling is C#-first. C++/WinRT is a first-class citizen for *consuming* WinRT APIs but lags in MVVM tooling, control libraries, and IDE support. The stack below works *with* this reality rather than fighting it.

---

## 1. Development Environment

### Required Tools

| Tool | Version | Purpose | Why |
|------|---------|---------|-----|
| **Visual Studio 2022** | 17.12+ (or VS 2026) | IDE, compiler, debugger | Only IDE with WinUI 3 project templates for C++/WinRT. The "Windows application development" workload includes everything needed. |
| **Windows App SDK VSIX** | Ships with VS workload | Project templates, MSIX tooling | Required for WinUI 3 Blank App (Packaged) template. Installed automatically with the workload. |
| **Windows SDK** | 10.0.22621.0+ (build 20348+) | Headers, libs, tools | WinUI 3 requires Windows 10 SDK 10.0.19041.0 minimum. The 22621 SDK matches Windows 11 22H2 and is the recommended baseline. |
| **NuGet** | Built into VS 2022 | Package management for .vcxproj | WinUI 3 C++ projects use native `.vcxproj` with `<PackageReference>` elements. NuGet is the primary package channel. |
| **vcpkg** | 2026.04.27 registry | Native C/C++ library manager | Used for sqlite3 (and sqlite_orm). vcpkg integrates with CMake and MSBuild via `VCPKG_ROOT`. |

### Workloads to Install

From Visual Studio Installer → **Windows application development** workload:
- **Required:** "Windows application development" (core workload)
- **Required:** "C++ WinUI app development tools" (optional component under this workload)
- **Required:** "Universal Windows Platform development" (pulled automatically by C++ WinUI tools)
- **Required:** Windows 10 SDK (at least 10.0.19041.0)
- **Not needed:** .NET desktop development (C# not used)

### Environment Configuration

```powershell
# Enable Developer Mode (required for WinUI 3 app development/debug)
# Settings → Privacy & security → For developers → Developer Mode

# Set VCPKG_ROOT after cloning vcpkg
$env:VCPKG_ROOT = "C:\dev\vcpkg"
[Environment]::SetEnvironmentVariable("VCPKG_ROOT", $env:VCPKG_ROOT, "User")
```

---

## 2. Core Framework

### Windows App SDK (WinUI 3)

| Package | Version (stable) | NuGet ID | Purpose |
|---------|------------------|----------|---------|
| Windows App SDK | **1.8.7** | `Microsoft.WindowsAppSDK` | Core framework: WinUI 3 controls, App Lifecycle, MRT Core, DWriteCore |
| WinUI 3 | Bundled in WinAppSDK 1.8.7 | `Microsoft.WindowsAppSDK.WinUI` (implicit) | Modern XAML UI framework with Fluent Design |

**Why 1.8.7 (not 2.0-experimental):** As of May 2026, WinAppSDK 1.8.7 is the latest *stable* release (April 2026). WinAppSDK 2.0 is experimental-only — no stable release. A POS prototype must build on stable tooling to avoid chasing bugs in experimental APIs. Verified at: `github.com/microsoft/WindowsAppSDK/releases/tag/v1.8.6` and `github.com/microsoft/microsoft-ui-xaml/releases/tag/winui3%2Frelease%2F1.8.7`.

**Known limitation:** WinUI 3 (desktop) does not support `CanvasAnimatedControl` from Win2D — the game-loop rendering pattern. Not a problem for POS ordering UI (we use standard controls), but relevant if animated graphics are considered later.

### C++/WinRT Language Projection

| Package | Version | NuGet ID | Purpose |
|---------|---------|----------|---------|
| C++/WinRT | **2.0.250303.1** | `Microsoft.Windows.CppWinRT` | C++17 language projection for WinRT APIs. Generates projection headers, enables authoring runtime classes. |

**Verified:** `github.com/microsoft/cppwinrt/releases/tag/2.0.250303.1` — latest stable as of May 2025.

**Why NuGet over vcpkg:** The NuGet package (`Microsoft.Windows.CppWinRT`) integrates directly with MSBuild, customizing `.vcxproj` build rules to automatically generate C++/WinRT projection headers from `.idl` files, Windows SDK `.winmd`, and XAML markup. The vcpkg port provides `cppwinrt.exe` but lacks the MSBuild integration. For WinUI 3 projects, the NuGet package is the documented recommendation.

**Language standard:** C++17 (`/std:c++17`). C++20 is *supported* by C++/WinRT but has known issues with TwoWay data binding and XAML compiler interaction (verified in Microsoft Q&A threads and GitHub issues). Use C++17 for stability.

### Windows Implementation Library (WIL)

| Package | Version | NuGet ID | Purpose |
|---------|---------|----------|---------|
| WIL | **1.0.260126.7** | `Microsoft.Windows.ImplementationLibrary` | Header-only C++ helpers: COM wrappers, RAII, error handling, `unique_any`, `wil::com_ptr`, `FAIL_FAST` macros |

**Verified:** `github.com/microsoft/wil/releases/tag/v1.0.260126.7` — January 2026 release, 3.1M+ downloads.

**Why essential for this project:** C++/WinRT projects deal heavily with COM-style reference counting (`winrt::com_ptr`, `IInspectable*`). WIL provides:

- `wil::com_ptr<T>` — safer COM pointer management (compatible with WinRT)
- `wil::unique_any` — RAII wrappers for handles, files, registry keys
- `RETURN_IF_FAILED` / `LOG_IF_FAILED` — simplified HRESULT error handling
- `wil::result_from_hr` — structured exception handling for WinRT APIs

Without WIL, every HRESULT check, COM pointer, and Win32 resource requires manual boilerplate — makes the codebase harder to maintain, especially in a POS app that must be resilient.

---

## 3. Data Layer

### SQLite

| Library | Version | Integration | Purpose |
|---------|---------|-------------|---------|
| SQLite3 | 3.46+ (amalgamation) | vcpkg: `sqlite3[core]` | SQLite database engine |
| sqlite_orm | **1.9.1** | vcpkg: `sqlite-orm` | C++17/20 header-only ORM: type-safe queries, schema generation, CRUD |

**Recommended approach:** `sqlite_orm` for the data access layer, with the raw C API (`sqlite3.h`) available for direct SQL when needed.

**Why sqlite_orm over alternatives:**

| Approach | Verdict | Reason |
|----------|---------|--------|
| **sqlite_orm** | **RECOMMENDED** | Type-safe C++ DSL, no raw SQL strings, schema-from-structs, migrations support, single header, 3K GitHub stars, active maintenance (v1.9.1 Feb 2025). Requires C++17 (we use C++17 already). |
| Direct C API (sqlite3.h) | ACCEPTABLE fallback | Works for simple queries, but leads to string-concatenated SQL, no compile-time checking, error-prone for complex queries across menu items, cart, orders. |
| SQLiteCpp | NOT recommended | C++ wrapper but still raw SQL strings. Less type safety. Last release 2020. |
| ZXorm | NOT recommended | Author explicitly states "no Windows machine, won't add Windows support." — `github.com/crabmandable/zxorm` |
| SQLiteWinRT | NOT recommended | 2013-era WinRT wrapper, abandoned, designed for Windows Store 8.0 apps. |

**License consideration for sqlite_orm:** AGPL-3.0 for open-source use; MIT license available for **$50 purchase** (one-time). For a commercial POS deployed to restaurant chains, the MIT license is required — factor $50 into project budget. The purchase is via the author's email (fnc12@me.com). See `sqliteorm.com`.

**How to integrate via vcpkg:**

```json
// vcpkg.json (manifest mode — committed to repo)
{
  "name": "vegapos",
  "version": "0.1.0",
  "dependencies": [
    "sqlite3",
    "sqlite-orm"
  ]
}
```

```xml
<!-- .vcxproj integration -- vcpkg integrates via msbuild props -->
<Import Project="$(VCPKG_ROOT)\scripts\buildsystems\msbuild\vcpkg.props" />
```

**Database design for POS ordering:**

```
Tables (defined via sqlite_orm struct mapping):
  menu_categories:  id, name, sort_order, is_visible
  menu_items:       id, category_id, name, description, price, image_path, is_available
  modifiers:        id, name, type (single/multi), is_required
  modifier_options: id, modifier_id, name, price_adjustment
  item_modifiers:   item_id, modifier_id (join table)
  cart_items:       id, session_id, menu_item_id, quantity, unit_price, notes
  cart_modifiers:   cart_item_id, modifier_option_id, quantity
  orders:           id, order_number, table_number, status, subtotal, tax, total, created_at
  order_items:      id, order_id, menu_item_id, quantity, unit_price, line_total, notes
  order_modifiers:  order_item_id, modifier_option_name, price_adjustment
```

**Schema management approach:** sqlite_orm's `sync_schema()` handles schema creation/updates from C++ struct definitions at startup. For v1 prototype, this is sufficient. For production, add explicit migration versioning later.

---

## 4. Architecture & MVVM Pattern

### Critical Reality: No C++ MVVM Toolkit

**There is no official Microsoft MVVM toolkit for C++/WinRT.** The `.NET Community Toolkit` (`CommunityToolkit.Mvvm`) and `Windows Community Toolkit` (`CommunityToolkit.WinUI`) are **C# only** — they depend on .NET source generators and CLR features that do not exist in native C++.

The unofficial `lgztx96/CommunityToolkit.WinUI` C++ port (30 stars, alpha quality, 1 contributor) provides *controls only* (Segmented, SettingsCard, ImageCropper) — not MVVM infrastructure. **Do not depend on it for v1.**

**Strategy:** Implement MVVM manually using what C++/WinRT gives us:
- IDL-defined runtime classes as ViewModels
- Manual `INotifyPropertyChanged` implementation
- `{x:Bind}` for compile-time XAML data binding (preferred, performant)
- `{Binding}` with `[Bindable]` attribute for dynamic scenarios

### ViewModel Pattern

Each ViewModel is a WinRT runtime class defined in `.idl`:

```idl
// MenuViewModel.idl
namespace vegaPOS.ViewModels
{
    runtimeclass MenuViewModel : Microsoft.UI.Xaml.Data.INotifyPropertyChanged
    {
        MenuViewModel();
        Windows.Foundation.Collections.IObservableVector<vegaPOS.Models.MenuCategory> Categories{ get; };
        Windows.Foundation.Collections.IObservableVector<vegaPOS.Models.MenuItem> CurrentItems{ get; };
        String SelectedCategoryName{ get; };
        void LoadCategories();
        void SelectCategory(Int32 categoryId);
    }
}
```

```cpp
// MenuViewModel.h
namespace winrt::vegaPOS::ViewModels::implementation
{
    struct MenuViewModel : MenuViewModelT<MenuViewModel>
    {
        MenuViewModel() = default;

        Windows::Foundation::Collections::IObservableVector<vegaPOS::Models::MenuCategory> Categories();
        Windows::Foundation::Collections::IObservableVector<vegaPOS::Models::MenuItem> CurrentItems();
        winrt::hstring SelectedCategoryName();
        void SelectedCategoryName(winrt::hstring const& value);

        void LoadCategories();
        void SelectCategory(int32_t categoryId);

        // INotifyPropertyChanged
        winrt::event_token PropertyChanged(Windows::UI::Xaml::Data::PropertyChangedEventHandler const& handler);
        void PropertyChanged(winrt::event_token const& token) noexcept;

    private:
        void RaisePropertyChanged(std::wstring_view propertyName);
        
        Windows::Foundation::Collections::IObservableVector<vegaPOS::Models::MenuCategory> m_categories{ nullptr };
        Windows::Foundation::Collections::IObservableVector<vegaPOS::Models::MenuItem> m_currentItems{ nullptr };
        winrt::hstring m_selectedCategoryName;
        winrt::event<Windows::UI::Xaml::Data::PropertyChangedEventHandler> m_propertyChanged;
    };
}
```

### Data Binding Rules

| Binding Mechanism | When to Use | C++/WinRT Notes |
|------------------|-------------|-----------------|
| `{x:Bind ViewModel.Property, Mode=OneWay}` | **Default** for all display data | Compile-time checked, better performance. Requires property in IDL (`get` accessor). |
| `{x:Bind ViewModel.Property, Mode=TwoWay}` | Input fields (cart quantity, notes) | Requires property with both `get`/`set` in IDL. Known C++20 issues — use C++17. |
| `{x:Bind ViewModel.Function(param), Mode=OneWay}` | Value converters, visibility | Function must be declared in IDL. Raise PropertyChanged with function name to trigger re-evaluation. |
| `{Binding Path, Mode=OneWay}` | Dynamic/DataContext scenarios | Requires `[Microsoft.UI.Xaml.Data.Bindable]` attribute on runtime class in IDL. Avoid if possible — prefer `{x:Bind}`. |
| `x:Bind` to named XAML elements | Element-to-element binding | C++/WinRT requires exposing the named element as a property in IDL (painful). Use `{Binding ElementName=...}` as workaround. |

**Critical pitfall:** `{x:Bind}` defaults to `Mode=OneTime` (not OneWay!) in both C# and C++/WinRT. OneTime means the binding sets the value once on load and never updates. **Always specify `Mode=OneWay` or `Mode=TwoWay` for any property that changes at runtime.** This is the #1 C++/WinRT binding bug reported across GitHub issues and StackOverflow.

### Navigation Pattern

Use `NavigationView` as the root shell, with a `Frame` as its content area:

```xaml
<!-- MainWindow.xaml -->
<NavigationView x:Name="NavView"
                PaneDisplayMode="LeftCompact"
                IsBackButtonVisible="Collapsed"
                ItemInvoked="OnNavItemInvoked">
    <NavigationView.MenuItems>
        <NavigationViewItem Content="Menu" Tag="menu" Icon="Shop" />
        <NavigationViewItem Content="Cart" Tag="cart" Icon="ShoppingCart" />
        <NavigationViewItem Content="Orders" Tag="orders" Icon="List" />
    </NavigationView.MenuItems>
    
    <ScrollViewer>
        <Frame x:Name="ContentFrame" />
    </ScrollViewer>
</NavigationView>
```

```cpp
// MainWindow.cpp — NavigationView item handler
void MainWindow::OnNavItemInvoked(winrt::Windows::Foundation::IInspectable const& /*sender*/,
    winrt::Microsoft::UI::Xaml::Controls::NavigationViewItemInvokedEventArgs const& args)
{
    auto const& tag = args.InvokedItemContainer().Tag().as<winrt::Windows::Foundation::IPropertyValue>().GetString();
    
    winrt::Windows::UI::Xaml::Interop::TypeName pageType{};
    
    if (tag == L"menu") 
        pageType = winrt::xaml_typename<vegaPOS::Views::MenuPage>();
    else if (tag == L"cart")
        pageType = winrt::xaml_typename<vegaPOS::Views::CartPage>();
    else if (tag == L"orders")
        pageType = winrt::xaml_typename<vegaPOS::Views::OrdersPage>();
    
    if (pageType.Name != nullptr)
        ContentFrame().Navigate(pageType, nullptr);
}
```

**Note:** Navigation requires each page type to be a runtime class (defined in `.idl` with `[default_interface]`). The `winrt::xaml_typename<T>()` function generates the `TypeName` struct needed by `Frame.Navigate()`.

---

## 5. Packaging & Deployment

### Recommended: MSIX Packaged App (Single-Project)

For v1 (prototype), use the default **Blank App, Packaged (WinUI in Desktop)** C++ project template. This creates a single-project MSIX package — no separate `.wapproj`:

```xml
<!-- .vcxproj (generated by template, key properties) -->
<PropertyGroup>
    <OutputType>WinExe</OutputType>
    <UseWinUI>true</UseWinUI>
    <EnableMsixTooling>true</EnableMsixTooling>
    <WindowsAppSDKSelfContained>false</WindowsAppSDKSelfContained>
</PropertyGroup>
```

**Why MSIX for POS:**
- Clean install/uninstall on restaurant terminals
- No bootstrapper API calls needed (unpackaged requires `MddBootstrapInitialize`)
- Windows App SDK runtime deployed as framework package dependency
- Side-by-side versioning for updates

**Self-contained deployment** (`<WindowsAppSDKSelfContained>true</WindowsAppSDKSelfContained>`) is an option for offline terminals without internet access, at the cost of ~100MB larger package.

### Unpackaged (Alternative for Later)

If MSIX deployment is problematic (e.g., restaurant IT policy blocks sideloading), configure unpackaged mode:

```xml
<PropertyGroup>
    <WindowsPackageType>None</WindowsPackageType>
    <WindowsAppSDKSelfContained>true</WindowsAppSDKSelfContained>
</PropertyGroup>
```

This requires:
1. Distributing the Windows App SDK runtime installer alongside the app
2. Calling `MddBootstrapInitialize()` in `main()` (or `winmain()`) before any WinUI API
3. No MSIX package identity → no Store submission

**For v1, stick with packaged (MSIX).** Defer unpackaged to production deployment planning.

---

## 6. Testing

### Unit Test Project Template

Visual Studio 2022 includes **WinUI Unit Test App** templates for both C# and C++. Use the **C++** template.

```xml
<!-- WinUI Unit Test App template (.vcxproj) includes: -->
<PackageReference Include="MSTest.TestAdapter" Version="3.*" />
<PackageReference Include="MSTest.TestFramework" Version="3.*" />
<PackageReference Include="Microsoft.TestPlatform.TestHost" Version="17.*" />
```

**Testing strategy for POS ordering:**

```
Solution structure:
  vegaPOS.sln
  ├── vegaPOS (WinUI 3 App - packaged)
  │   ├── Models/           # Data models (structs with sqlite_orm mapping)
  │   ├── ViewModels/       # WinRT runtime classes
  │   ├── Views/            # XAML Pages + code-behind
  │   └── Data/             # Database access layer
  ├── vegaPOS.ClassLib (WinUI Class Library - C++/WinRT)  ← for testability
  │   ├── Models/           # Same models (shared via project reference)
  │   └── Data/             # Database access (shared)
  └── vegaPOS.UnitTests (WinUI Unit Test App - C++/WinRT)
      └── DataLayerTests.cpp
```

**Rule:** Business logic (SQL queries, price calculations, cart operations) goes into the Class Library project, not the App project. The App project is a thin shell for XAML pages and ViewModels. Tests reference the Class Library.

```cpp
// DataLayerTests.cpp — example test
#include "pch.h"
#include "CppUnitTest.h"
#include "Data/MenuRepository.h"

using namespace Microsoft::VisualStudio::CppUnitTestFramework;

namespace vegaPOS::Tests
{
    TEST_CLASS(MenuRepositoryTests)
    {
    public:
        TEST_METHOD(TestGetCategories_ReturnsOrderedList)
        {
            auto repo = vegaPOS::Data::MenuRepository();
            auto categories = repo.GetCategories();
            Assert::IsTrue(categories.Size() > 0);
            // Verify sort order
            int32_t prevOrder = -1;
            for (auto const& cat : categories)
            {
                Assert::IsTrue(cat.SortOrder() >= prevOrder);
                prevOrder = cat.SortOrder();
            }
        }
        
        TEST_METHOD(TestCalculateCartTotal_NoModifiers)
        {
            vegaPOS::Models::Cart cart;
            cart.AddItem(/* itemId= */ 1, /* qty= */ 2, /* price= */ 15.00);
            cart.AddItem(/* itemId= */ 2, /* qty= */ 1, /* price= */ 25.00);
            Assert::AreEqual(55.00, cart.CalculateTotal());
        }
    };
}
```

**UI test limitation:** XAML-dependent tests require `[UITestMethod]` attribute (runs on UI thread). For v1, focus on data layer and ViewModel tests (no UI rendering needed). XAML unit testing is fragile and slow — test through the ViewModel's observable properties instead.

---

## 7. NuGet Packages (Complete List)

Install these into the `.vcxproj` via NuGet Package Manager:

```xml
<ItemGroup>
    <!-- Core framework -->
    <PackageReference Include="Microsoft.WindowsAppSDK" Version="1.8.7" />
    
    <!-- C++/WinRT language projection -->
    <PackageReference Include="Microsoft.Windows.CppWinRT" Version="2.0.250303.1" />
    
    <!-- Windows Implementation Library (COM/RAII helpers) -->
    <PackageReference Include="Microsoft.Windows.ImplementationLibrary" Version="1.0.260126.7" />
    
    <!-- Windows SDK Build Tools -->
    <PackageReference Include="Microsoft.Windows.SDK.BuildTools" Version="10.0.22621.3233" />
</ItemGroup>
```

**Native dependencies (via vcpkg manifest mode):**

```json
// vcpkg.json
{
  "name": "vegapos",
  "version": "0.1.0",
  "dependencies": [
    "sqlite3",
    "sqlite-orm"
  ]
}
```

---

## 8. What NOT to Use (And Why)

| Technology | Reason for Exclusion | Source |
|------------|---------------------|--------|
| **CommunityToolkit.Mvvm** | C#/.NET only. Source generators depend on Roslyn/C# compiler. Cannot be consumed from C++/WinRT. | `github.com/CommunityToolkit/Windows` README confirms C# only. |
| **CommunityToolkit.WinUI** | C# only (WinRT Component restriction). Controls are not Windows Runtime Components — they're C# class libraries. Cannot be referenced from C++ projects. | `github.com/CommunityToolkit/Sample-Windows-CppWinRT` describes the "C# Island" workaround — manual, fragile, requires .NET runtime. |
| **CommunityToolkit.WinUI (C++ port)** | Unofficial (lgztx96), 30 stars, 1 contributor, alpha quality (v0.4.0-alpha). Only a few controls ported. Not production-ready. | `github.com/lgztx96/CommunityToolkit.WinUI` |
| **Win2D CanvasAnimatedControl** | Not supported in WinUI 3 (Win32 desktop). Only `CanvasControl`, `CanvasVirtualControl`, `CanvasSwapChainPanel` work. | `microsoft.github.io/Win2D/WinUI3/html/Features.htm` — "Not supported for WinUI3" |
| **CsWinRT** | C#-to-WinRT interop layer. Only needed if mixing C# and C++ in same app. Not needed for pure C++/WinRT. | `github.com/microsoft/CsWinRT` |
| **C++/CX** | Deprecated language extension. Replaced by standard C++/WinRT. Microsoft docs explicitly recommend against new C++/CX development. | `aka.ms/cppwinrt` |
| **Electron / Tauri / Web-based** | The whole point of the rewrite. Chromium bloat, security issues, no native Windows integration. | Project context. |
| **C++20 standard** | Causes TwoWay `{x:Bind}` compilation errors with WinUI 3 XAML compiler (known bug). Stick with `/std:c++17`. | Verified in Microsoft Q&A and GitHub issue #7100 discussion. |

---

## 9. Development Workflow

### Creating the Project

```powershell
# 1. Open Visual Studio 2022
# 2. File → New → Project → Search "WinUI"
# 3. Select: "Blank App, Packaged (WinUI in Desktop)" — C++ template
# 4. Configure:
#    - Project name: vegaPOS
#    - Location: D:\Side Dev\vegaPOS\src
#    - Check "Place solution and project in the same directory"
# 5. Create
# 6. After creation, verify packages via NuGet Package Manager
```

### Build Configuration

| Configuration | Use | Notes |
|--------------|-----|-------|
| **Debug (x64)** | Active development | Full debug symbols, slower perf |
| **Release (x64)** | Testing/QA | Optimized, no debug output |
| **Release (x86)** | Not needed | Modern Windows is x64 |

**Set C++ language standard:**
Project Properties → C/C++ → Language → C++ Language Standard → **ISO C++17 Standard (`/std:c++17`)**

### Precompiled Header (pch.h)

```cpp
// pch.h — precompiled for build speed
#include <algorithm>
#include <vector>
#include <string>
#include <memory>

// C++/WinRT
#include <winrt/base.h>
#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.Foundation.Collections.h>

// WinUI 3 (generated by CppWinRT NuGet)
#include <winrt/Microsoft.UI.Xaml.h>
#include <winrt/Microsoft.UI.Xaml.Controls.h>
#include <winrt/Microsoft.UI.Xaml.Navigation.h>
#include <winrt/Microsoft.UI.Xaml.Data.h>
#include <winrt/Microsoft.UI.Xaml.Media.h>

// Windows App SDK
#include <winrt/Microsoft.Windows.ApplicationModel.DynamicDependency.h>

// WIL
#include <wil/cppwinrt.h>
#include <wil/com.h>

// SQLite ORM
#include <sqlite_orm/sqlite_orm.h>

// Project headers
#include "vegaPOS/vegaPOS.h"  // generated project headers
```

---

## 10. Confidence Assessment

| Component | Confidence | Basis |
|-----------|------------|-------|
| WinUI 3 + WinAppSDK 1.8.7 | **HIGH** | Verified stable release on GitHub, Microsoft Learn docs, release notes |
| C++/WinRT 2.0.250303.1 | **HIGH** | Official NuGet package, Microsoft docs, winget-cli uses it |
| WIL 1.0.260126.7 | **HIGH** | Official Microsoft package, widely used (3.1M+ downloads) |
| sqlite_orm 1.9.1 | **HIGH** | Verified GitHub release, vcpkg integration, 3K stars, active |
| No C++ MVVM toolkit | **HIGH** | Confirmed by Microsoft docs, GitHub issues, CommunityToolkit repo |
| MSIX packaging | **HIGH** | Standard template, well-documented |
| MSTest for unit testing | **HIGH** | Official WinUI Unit Test App template in VS2022 |
| {x:Bind} for C++/WinRT | **MEDIUM** | Works but requires extensive IDL boilerplate; known issues with C++20 and TwoWay |
| CommunityToolkit C++ port | **LOW** | Alpha quality, single contributor. Do not rely on. |

---

## Sources

1. **Windows App SDK 1.8.7 Release:** `github.com/microsoft/WindowsAppSDK/releases/tag/v1.8.6` (stable)
2. **WinUI 3 in WinAppSDK 1.8.7:** `github.com/microsoft/microsoft-ui-xaml/releases/tag/winui3%2Frelease%2F1.8.7`
3. **C++/WinRT 2.0.250303.1:** `github.com/microsoft/cppwinrt/releases/tag/2.0.250303.1`
4. **WIL 1.0.260126.7:** `github.com/microsoft/wil/releases/tag/v1.0.260126.7`
5. **sqlite_orm 1.9.1:** `github.com/fnc12/sqlite_orm/releases/tag/v1.9.1`
6. **WinUI 3 Get Started:** `learn.microsoft.com/en-us/windows/apps/winui/winui3/`
7. **C++/WinRT Data Binding:** `learn.microsoft.com/en-us/windows/uwp/cpp-and-winrt-apis/binding-property`
8. **WinUI 3 Unit Testing:** `learn.microsoft.com/en-us/windows/apps/winui/winui3/testing/create-winui-unit-test-project`
9. **WinUI MSIX Packaging:** `learn.microsoft.com/en-us/windows/apps/windows-app-sdk/single-project-msix`
10. **Win2D WinUI3 Status:** `microsoft.github.io/Win2D/WinUI3/html/Features.htm`
11. **CommunityToolkit C++ limitation:** `github.com/CommunityToolkit/WindowsCommunityToolkit/issues/4044`
12. **C++ CommunityToolkit Port:** `github.com/lgztx96/CommunityToolkit.WinUI`
13. **Visual Studio WinUI Workload (2024):** `devblogs.microsoft.com/visualstudio/dive-into-native-windows-development-with-new-winui-workload-and-template-improvements/`
14. **WinUI 3 Performance Discussion (2026):** `github.com/microsoft/microsoft-ui-xaml/discussions/11096`
