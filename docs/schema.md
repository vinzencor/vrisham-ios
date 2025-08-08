# Firestore Database Schema (Updated — May 2025)

This document outlines the collections and field structures used in the Firestore database. This version includes the new category tagging system and product-variant functionality.

## Collections

### 1. Categories
Stores product categories and their hierarchical relationships.

| Field | Type | Notes |
|-------|------|-------|
| branchCode | string | outlet / warehouse id |
| id | string | Legacy duplicate of doc-ID (may be removed) |
| image | string | HTTPS URL |
| index | number | display / sort order |
| isParentCategory | boolean | = true when level == 0 (kept for backward compatibility) |
| keyword | string[] | search prefixes |
| name | string | display name |
| parentCategoryID | string \| null | null for root |
| level | number | **NEW.** 0 = root, 1 = sub, etc. |

### 2. OnlinePayStatus
Tracks online payment transactions and their statuses.

| Field | Type | Notes |
|-------|------|-------|
| amount | number | |
| code | string | PhonePe status code |
| fullResponse | string | raw JSON string – consider storing as map |
| merchantId | string | |
| message | string | |
| payResponseCode | string | |
| paymentInstrument | string | raw JSON – convert to map for easy querying |
| paymentState | string | |
| phonepeTransactionId | string | |
| success | boolean | |
| transactionId | string | |

### 3. DeleteAccountRequest
Records user account deletion requests.

| Field | Type |
|-------|------|
| requestTime | timestamp |
| userID | string |

### 4. OrderExportHistory
Tracks history of order exports.

| Field | Type |
|-------|------|
| fromDate | string (ISO) |
| toDate | string (ISO) |
| queryTime | timestamp |
| resultCount | number |

### 5. Orders
Stores customer orders and their details.

| Field | Type |
|-------|------|
| addressID | string / number |
| addressLandmark | string |
| addressLines | string |
| addressName | string |
| addressPhoneNumber | string |
| addressPincode | string |
| assignedAgentID | string |
| assignedAgentName | string |
| assignedTime | timestamp |
| branchCode | string |
| completedTime | timestamp (opt.) |
| confirmedTime | timestamp |
| customerID | string |
| customerName | string |
| deliveryCharge | number |
| grandTotal | number |
| modeOfPayment | string (cod \| online) |
| orderID | number |
| orderedItem | OrderedItem[] |
| orderedTime | timestamp |
| paymentStatus | string (paid / pending) |
| phoneNumber | string |
| pickedTime | timestamp (opt.) |
| status | string (placed \| assigned \| delivered ...) |
| subTotal | number |
| couponCode | string \| null | Copied from Coupons.code when coupon is applied |
| couponDiscount | number \| null | Rupees discounted from grandTotal when coupon is applied |

#### OrderedItem (array element)

| Field | Type | Notes |
|-------|------|-------|
| addedTime | timestamp | |
| barcode | string | |
| branchCode | string | |
| categoryID | string | Primary category at purchase time |
| variantID | string \| null | **NEW.** Variant doc-ID if item has variants |
| variationValues | map<string,string> \| null | **NEW.** e.g. { Size: "Medium" } |
| description | string | |
| id | string | Product doc-ID |
| image | string | |
| incrementalQuantity | number | |
| index | number | |
| keyword | string[] | |
| maxQuantity | number | |
| minQuantity | number | |
| mrp | number | |
| name | string | |
| nutrition | string | |
| price | number | Unit price at purchase |
| quantity | number | |
| sourcingStory | string | |
| status | string | |
| unit | string | |

### 6. Pincodes
Maps postal codes to delivery areas and branches.

| Field | Type |
|-------|------|
| areaName | string |
| branchCode | string |
| branchName | string |
| deliveryCharge | number |
| pincode | string |

### 7. Products
Master product records.

**Important**: When `hasVariants = true`, the product-level `price`, `mrp`, `barcode`, and `maxQuantity` fields serve as fallbacks only. The actual pricing, inventory, and SKU data should be retrieved from the Variants sub-collection.

**Pre-Order & Harvest Features**:
- When `isPreOrder = true`, the product is shown in pre-order state and never counted against live inventory
- `preOrderStartAt` and `preOrderEndAt` define optional pre-order windows (both null = always available for pre-order)
- `harvestOffsetDays` determines harvest timing relative to current date: -1 (yesterday), 0 (today), +1 (tomorrow)
- Front-end shows "Harvest on DD-MMM" by adding offset to current date
- **Delivery Logic**: Default next day delivery, except if pre-order is on OR harvest day is tomorrow (then delivery is day after tomorrow)

| Field | Type | Notes |
|-------|------|-------|
| barcode | string | Fallback SKU - ignored if hasVariants=true |
| branchCode | string | |
| categoryIDs | string[] | **NEW.** All categories & sub-categories this product belongs to |
| primaryCategoryID | string | **NEW (opt.)** Main breadcrumb |
| description | string | |
| id | string | |
| image | string | |
| incrementalQuantity | number | |
| index | number | |
| keyword | string[] | |
| maxQuantity | number | Fallback inventory - ignored if hasVariants=true |
| minQuantity | number | |
| mrp | number | Fallback MRP - ignored if hasVariants=true |
| name | string | |
| nutrition | string | |
| price | number | Default (fallback) price - ignored if hasVariants=true |
| sourcingStory | string | |
| status | string (active \| inActive) | |
| unit | string | |
| farmerId | string \| null | |
| hasVariants | boolean | **NEW.** true if using /Variants sub-collection |
| defaultVariantID | string \| null | **NEW.** Doc-ID of the variant to show first |
| isPreOrder | boolean | **NEW.** Toggle for pre-order state (default: false) |
| preOrderStartAt | timestamp \| null | **NEW.** Pre-order window start (null = open immediately) |
| preOrderEndAt | timestamp \| null | **NEW.** Pre-order window end |
| harvestOffsetDays | number | **NEW.** Harvest timing: -1 (yesterday), 0 (today), +1 (tomorrow) |

#### 7a. Variants (sub-collection)
Path: /Products/{productId}/Variants/{variantId}

| Field | Type | Notes |
|-------|------|-------|
| sku | string | Barcode / SKU |
| variationValues | map<string,string> | Keys are VariationType names or IDs, e.g. { Size: "Small" } |
| price | number | |
| mrp | number | |
| stock | number | Current inventory |
| image | string \| null | Override parent |
| status | string (active \| inActive) | |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### 8. Returns
Now variant-aware.

| Field | Type |
|-------|------|
| branchCode | string |
| customerID | string |
| customerName | string |
| deliveryAgentID | string |
| deliveryAgentName | string |
| minimumQuantity | number |
| modeOfPayment | string |
| orderID | number |
| price | number |
| productID | string |
| variantID | string \| null |
| variationValues | map<string,string> \| null |
| productImage | string |
| productName | string |
| quantity | number |
| returnInitiatedTime | timestamp |
| returnStatus | string (pending \| approved \| rejected) |
| unit | string |

### 9. Support
Manages customer support tickets.

| Field | Type |
|-------|------|
| branchCode | string |
| contactedOn | timestamp |
| customerID | string |
| customerName | string |
| id | string |
| message | string |
| resolvedOn | timestamp (opt.) |
| status | string (open \| resolved) |
| ticketRaisedOn | timestamp |

### 10. Transactions
Records financial transactions.

| Field | Type |
|-------|------|
| amount | number |
| currentBalance | number |
| remark | string |
| role | string |
| runningBalance | number |
| transactionTime | timestamp |
| typeOfTransactions | string (inward \| outward) |
| userID | string |

### 11. Users
Stores user account information.

**Note**: Phone numbers are stored in the Address sub-documents within `listOfAddress`, not directly on the User document.

| Field | Type |
|-------|------|
| createdTime | timestamp |
| displayName | string |
| isDeactivated | boolean |
| isNewCustomer | boolean |
| keywords | string[] |
| listOfAddress | Address[] |
| role | string |
| uid | string |

#### Address (array element)

| Field | Type |
|-------|------|
| addressID | number |
| addressLines | string |
| addressName | string |
| branchCode | string |
| branchName | string |
| landmark | string |
| pincode | number |
| phoneNumber | string |

### 12. Conversations
Tracks customer service conversations.

| Field | Type |
|-------|------|
| chatFlow | string[] / map[] (opt.) |
| endTime | timestamp |
| id | string |
| isExistingUser | boolean |
| phoneNumber | string |
| startTime | timestamp |
| status | string (open \| closed) |
| tempAddressId | number |
| userName | string |

### 13. FF_Push_Notifications
Manages push notifications.

| Field | Type |
|-------|------|
| initialPageName | string |
| notificationSound | string |
| notificationText | string |
| notificationTitle | string |
| numSent | number |
| parameterData | string (JSON) |
| status | string |
| targetAudience | string |
| timestamp | timestamp |

### 14. MessageUpdates
Tracks message updates for customers.

| Field | Type | Notes |
|-------|------|-------|
| customer | map | nested phone / id / traits |
| message | map | WhatsApp message payload |
| id | string | event id |
| phoneNumber | string | |

### 15. TempOrders
Temporary carts (variant-aware).

| Field | Type |
|-------|------|
| cartId | string |
| createdDate | timestamp |
| orderItems | TempOrderItem[] |
| phoneNumber | string |
| status | string (CART_RECEIVED ...) |

#### TempOrderItem

| Field | Type |
|-------|------|
| itemId | string |
| variantID | string \| null |
| variationValues | map<string,string> \| null |
| price | number |
| quantity | number |

### 16. Farmers
Stores information about farmers who supply products.

| Field | Type | Notes |
|-------|------|-------|
| id | string | Firestore doc-id |
| farmerId | string | Unique identifier (FARM-XXXXXX format) |
| farmerName | string | Name of the farmer |
| farmName | string | Name of the farm |
| farmLocation | string | Location of the farm |
| experience | string | Years of farming experience |
| philosophy | string | Farming philosophy/approach |
| certifications | string[] | List of certifications held |
| tags | string[] | Keywords for searching/filtering |
| createdAt | timestamp | When the record was created |
| updatedAt | timestamp | When the record was last updated |

### 17. VariationTypes — NEW
Reusable option lists (e.g. Size, Length).

| Field | Type | Notes |
|-------|------|-------|
| id | string | Doc-ID |
| name | string | "Size", "Colour", ... |
| options | string[] | List in display order |
| description | string \| null | |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### 18. Coupons
Stores coupon codes and their configuration.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| code | string | yes | Human-readable coupon text (also use as doc-ID). Example: NEWUSER50 |
| type | string | yes | "FLAT" \| "PERCENT" |
| flatAmount | number | when type === "FLAT" | Amount off in rupees (₹). |
| percent | number | when type === "PERCENT" | Discount percentage (e.g. 10 for 10 %). |
| maxDiscount | number \| null | no | Cap for percentage coupons (₹). Ignored for flat. |
| minCartTotal | number \| null | no | Minimum order subtotal required to apply. |
| startAt | timestamp \| null | no | Valid-from; null → immediately active. |
| expiresAt | timestamp \| null | yes | Expiry date/time. |
| usageLimitGlobal | number | no | How many times in total the coupon can be redeemed. null → unlimited. |
| usageLimitPerUser | number | no | How many times a single UID can redeem (set 1 for "once per user"). null → unlimited per user. |
| usedCount | number | no, default 0 | Auto-incremented counter (for quick catalog queries). |
| isActive | boolean | no, default true | Admin kill-switch. |
| description | string \| null | no | For admin dashboard display. |
| createdAt / updatedAt | timestamp | yes | |

**Security / write note**: Only trusted Cloud Functions (or admin app) should update usedCount; clients write to Redemptions (below).

#### 18a. Redemptions (sub-collection)
Path: /Coupons/{code}/Redemptions/{autoId} – one doc per successful use.

| Field | Type | Notes |
|-------|------|-------|
| uid | string | Customer UID who redeemed. |
| orderID | number | Order that consumed the coupon. |
| discountAmount | number | Rupees knocked off that order. |
| redeemedAt | timestamp | |
| branchCode | string | Optional auditing. |

A Cloud Function on document create:

**Checks limits**
```js
if (coupon.usedCount >= coupon.usageLimitGlobal) throw "OUT_OF_STOCK";
if (timesUserUsed >= coupon.usageLimitPerUser) throw "ALREADY_USED";
if (now < coupon.startAt || now > coupon.expiresAt) throw "EXPIRED";
```

**Increments coupon.usedCount += 1** in the same transaction.

**Writes the Redemption doc** (enables per-user analytics without exploding array sizes).

## Typical Write-Flow (Pseudo)

### Admin adds a product
1. Picks primary category
2. Ticks additional categories (writes categoryIDs)
3. Toggles "Has variants"
4. If variants on:
   - Chooses one or more VariationTypes (e.g. Size)
   - UI renders an option grid; admin creates Variant docs → each doc stores its own variationValues, price, stock.

### User orders
- Front-end writes variantID + variationValues into the cart line.

## Example: Product with Variants

### Product Document (Watermelon)
```json
{
  "id": "watermelon-001",
  "name": "Fresh Watermelon",
  "hasVariants": true,
  "defaultVariantID": "variant-medium",
  "price": 50,        // Fallback - ignored since hasVariants=true
  "mrp": 60,          // Fallback - ignored since hasVariants=true
  "barcode": "WM001", // Fallback - ignored since hasVariants=true
  "maxQuantity": 100, // Fallback - ignored since hasVariants=true
  "categoryIDs": ["fruits", "seasonal-fruits"],
  "primaryCategoryID": "fruits"
}
```

### Variants Sub-collection
```json
// /Products/watermelon-001/Variants/variant-small
{
  "sku": "WM001-S",
  "variationValues": { "Size": "Small" },
  "price": 30,
  "mrp": 35,
  "stock": 50
}

// /Products/watermelon-001/Variants/variant-medium
{
  "sku": "WM001-M",
  "variationValues": { "Size": "Medium" },
  "price": 50,
  "mrp": 60,
  "stock": 30
}

// /Products/watermelon-001/Variants/variant-large
{
  "sku": "WM001-L",
  "variationValues": { "Size": "Large" },
  "price": 80,
  "mrp": 90,
  "stock": 20
}
```

### UI Display Logic
- **Product Card**: Shows Medium variant data (price: ₹50, stock: 30) since it's the default
- **Product Details**: User can select Small/Medium/Large, prices update accordingly
- **Add to Cart**: Stores specific variant info (variantID + variationValues)
