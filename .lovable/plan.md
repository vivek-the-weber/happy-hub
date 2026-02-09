

## Update Buyer Payment Screen

Three changes to `src/pages/OrderPayment.tsx`:

### 1. Remove "Pay via UPI" button
Delete lines 103-113 (the entire pay button block) and the now-unused `upiLink` variable and `handlePay` function (lines 45-49).

### 2. Remove "The order will be confirmed after the seller enters this code." text
Delete line 124-126 from the buyer instructions section.

### 3. Add green instruction to enter the code in UPI note
Add a prominent green-colored instruction below the Payment Code card telling the buyer to enter the exact code (in all caps) as the note when paying in their UPI app. Example text:

**"Enter the code {ORDER_CODE} in the note/remarks while paying in your UPI app"** -- displayed in green (`text-green-400`), placed right after the payment code display.

---

### Technical Details

**File: `src/pages/OrderPayment.tsx`**

| Change | Lines | Detail |
|--------|-------|--------|
| Remove `upiLink` and `handlePay` | 45-49 | Dead code after button removal |
| Remove Pay via UPI button | 103-113 | Entire button block |
| Remove "seller enters this code" line | 124-126 | Single instruction line |
| Add green note instruction | After line 83 (inside Payment Code card) | Green text with the exact code in caps |
| Remove `Button` import | 3 | No longer used on this page (still used in error state -- will check) |

The `Button` import is still needed for the "Go Home" button in the error state, so it stays.

