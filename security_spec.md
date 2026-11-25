# Security Specification — Sable & Silk Boutique Platform

## 1. Data Invariants
1. **Identity Integrity**: Users may only create their own `users/{userId}` document with `role == 'customer'` and `uid == request.auth.uid`. Only an existing admin can elevate a user to `dispatcher` or `admin`.
2. **PII Isolation**: User profiles (`email`, `phone`, `defaultAddress`) and customer orders (`deliveryPhone`, `deliveryAddress`) are strictly readable only by the owning user or an authorized dispatcher/admin.
3. **Atomic Stock Integrity**: Customers cannot decrement `commodities/{commodityId}.stockQuantity` below `0`, cannot increase stock, and cannot modify pricing, SKU, or active status.
4. **Order & Subcollection Atomicity**: Order line items (`orders/{orderId}/items/{itemId}`) and initial tracking events (`orders/{orderId}/tracking/{eventId}`) validate parent order ownership via `getAfter()`/`get()`.
5. **Terminal State Locking**: Once an order reaches `Delivered`, no further status transitions are permitted by dispatchers.
6. **Temporal Integrity**: All `createdAt` and `updatedAt` timestamps must match `request.time`.
7. **Admin vs Dispatcher Separation of Duties**: Only `admin` users may create, price, restock, or delete `commodities` and assign `assignedDispatcherUid` on orders or change user roles. Dispatchers may only view and advance delivery milestones on orders assigned to them (`assignedDispatcherUid == request.auth.uid`) and cannot modify catalog items or roles.

## 2. The "Dirty Dozen" Payloads
1. **Self-Assigned Admin Role**: `POST /users/{uid}` with `{ role: "admin" }` -> `PERMISSION_DENIED`.
2. **Shadow Field Injection on User Profile**: `UPDATE /users/{uid}` adding `{ isVerifiedPartner: true }` -> `PERMISSION_DENIED`.
3. **Unverified Email Write**: Authenticated user with `email_verified: false` creating an order -> `PERMISSION_DENIED`.
4. **Cross-User Order Read**: Customer B reading `orders/{orderA}` -> `PERMISSION_DENIED`.
5. **Overselling Stock**: Customer updating `commodities/{id}` with `stockQuantity: -5` -> `PERMISSION_DENIED`.
6. **Price Tampering on Checkout**: Customer updating `commodities/{id}` changing `unitPrice: 1` -> `PERMISSION_DENIED`.
7. **Status Shortcutting on Order Create**: Customer creating `orders/{id}` with `status: "Delivered"` -> `PERMISSION_DENIED`.
8. **Forged Timestamp**: Creating `orders/{id}` with backdated `createdAt` (`!== request.time`) -> `PERMISSION_DENIED`.
9. **ID Poisoning**: Creating document with 500-character ID or invalid characters -> `PERMISSION_DENIED`.
10. **Customer Advancing Own Delivery Status**: Customer updating `orders/{id}` to `status: "In Transit"` -> `PERMISSION_DENIED`.
11. **Mutating Terminal Delivered Order**: Dispatcher modifying an order whose existing `status == "Delivered"` -> `PERMISSION_DENIED`.
12. **Blanket List Scraping**: Customer calling `list` on `orders` without filtering to `customerUid == request.auth.uid` -> `PERMISSION_DENIED`.
