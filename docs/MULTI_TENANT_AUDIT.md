# TUPÁ Hub Multi-Tenant Architecture Audit

## Current State Analysis (Phase 1)

### 🏗️ **EXISTING MULTI-TENANT INFRASTRUCTURE**

#### **1. Context Management**
- ✅ **LocationContext** - Fully implemented
  - Manages `group`, `locations`, `activeLocation`
  - Location switching functionality 
  - Session persistence
  - Edge function integration (`location-context`, `set-location`)

#### **2. Database Model** 
Current structure shows mixed nomenclature:

**Groups & Locations (Primary Multi-tenant Model):**
- `groups` table - Organizational level
- `locations` table - Site level with `group_id` FK
- `users` table - Has both `group_id` and `location_id`

**Cafes Model (Legacy/Parallel):**
- `cafes` table - Separate entity with `owner_id`
- Used primarily in feedback/giveaway systems

#### **3. Current Route Structure**

**Existing Multi-tenant Routes:**
```
/feedback/:cafeId              # Uses cafeId
/cafe/dashboard/:cafeId        # Uses cafeId
```

**Location-agnostic Routes:**
```
/app/*                         # Should be location-aware
/admin/*                       # Global admin
/recipes                       # Should be location-specific
```

#### **4. Component Analysis**

**✅ Already Location-Aware:**
- `CafeOwnerDashboard` - Uses `cafeId` parameter
- `AdvisoryRequestsViewer` - Location-specific
- `FeedbackForm` - Cafe-specific
- `QRDashboard` - Cafe/location-specific

**⚠️ Partially Location-Aware:**
- `AdminMonitoringHub` - Some location filtering
- `GiveawayAdminPanel` - Cafe filtering

**❌ Not Location-Aware (Need Migration):**
- `Dashboard` - Should use active location
- `Consumo` - Uses `location_id` in RLS but no UI context
- `Recetas` - Has location-based RLS but no context
- `MiEquipo` - Should be location-specific

### 🔍 **DATA MODEL INCONSISTENCIES**

#### **Nomenclature Issues:**
1. **cafe_id vs location_id** - Two parallel systems
2. **cafeId vs location_id** - Mixed URL parameters
3. **group_id** - Proper multi-tenant hierarchy

#### **Database Tables by Model:**

**Location Model (RLS-based):**
- `consumptions` - Uses `location_id`
- `recipes` - Uses `location_id` 
- `orders` - Uses `location_id`
- `users` - Has both `group_id` + `location_id`

**Cafe Model (Parameter-based):**
- `feedbacks` - Uses `cafe_id`
- `giveaway_participants` - Uses `cafe_id`
- `advisory_requests` - Uses `cafe_id`

### 🛠️ **EDGE FUNCTIONS ANALYSIS**

**Location-Aware Functions:**
- ✅ `location-context` - Full location management
- ✅ `set-location` - Location switching
- ✅ `migrate-multi-location` - Data migration support

**Cafe-Aware Functions:**
- `feedback` related functions
- `giveaway` functions
- `qr-generate` 

### 🚨 **CRITICAL FINDINGS**

#### **Issues Identified:**
1. **Dual Entity Model** - `cafes` and `locations` serving similar purposes
2. **Mixed Route Patterns** - `/cafe/:cafeId` vs `/app/*` (no location context)
3. **RLS vs Parameter Mismatch** - Some components use RLS, others use route params
4. **Context Gap** - LocationContext not used in many location-aware components

#### **Compatibility Matrix:**
| Component | Current Model | Target Model | Migration Complexity |
|-----------|---------------|--------------|---------------------|
| Dashboard | None | location_id | Medium |
| Consumo | RLS location_id | location_id | Low |
| Recetas | RLS location_id | location_id | Low |
| CafeDashboard | cafeId param | location_id | High |
| FeedbackForm | cafeId param | location_id | High |

### 📋 **NEXT STEPS (Phase 2 Prep)**

#### **Immediate Decisions Needed:**
1. **Standardize on locations model** - Deprecate or map cafes→locations
2. **Route pattern decision** - `/tenants/:locationSlug/*` vs current patterns
3. **Component migration strategy** - Gradual vs bulk migration

#### **Risk Assessment:**
- 🔴 **High Risk**: Changing cafe-based routes (feedback, dashboard)
- 🟡 **Medium Risk**: Adding location context to app routes  
- 🟢 **Low Risk**: Enhancing existing RLS-based components

### 🎯 **RECOMMENDED APPROACH**

1. **Normalize Data Model** - Create cafe_id ↔ location_id mapping
2. **Extend LocationContext** - Add cafe compatibility layer
3. **Gradual Route Migration** - Maintain backward compatibility
4. **Component-by-Component** - Start with lowest risk items

---
*Generated: Phase 1 Audit - January 2025*