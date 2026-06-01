

## Add Train Booking Icon to Header

Add a train booking icon (using Lucide's `TrainFront` icon) next to the existing bus and flight booking icons in the header. Clicking it will redirect users to the IRCTC website in a new tab.

### Changes

**File: `src/components/Header.tsx`**

1. Import `TrainFront` icon from `lucide-react`
2. Add a train booking icon button next to the bus and flight icons in the desktop navigation
3. Add a "Book Train Tickets" link in the mobile menu alongside the other booking options

Both links will open `https://www.irctc.co.in` in a new tab.

