# Todo List Equipment & Ruangan Segmented Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan Segmented Control tepat di bawah search bar pada komponen To-Do List ES Dashboard untuk memisahkan daftar tugas antara Equipment dan Ruangan dengan default aktif di Equipment.

**Architecture:** Memanfaatkan prop `objectType: "EQUIPMENT" | "ROOM"` yang sudah ada pada `UserTodoTaskItem`. Tambahkan state `selectedObjectType` di `TodoListPanel`, hitung pending count per kategori secara memoized, lalu masukkan filter kategori ke dalam useMemo filtering dan render Segmented Control tepat di bawah search input.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React (`Wrench`, `Building2`), TypeScript.

---

### Task 1: Update TodoListPanel Component

**Files:**
- Modify: `components/es-dashboard/todo-list-panel.tsx`
- Documentation: `docs/superpowers/specs/2026-10-13-todo-equipment-room-segmented-control-design.md`

**Interfaces:**
- Consumes: `UserTodoTaskItem.objectType` (`"EQUIPMENT" | "ROOM"` from `lib/tasks/todo-service.ts`)
- Produces: UI Segmented Control di bawah search bar dengan state `selectedObjectType` dan per-kategori pending counter.

- [ ] **Step 1: Import ikon `Building2` dan `Wrench` dari `lucide-react`**

Di bagian atas `components/es-dashboard/todo-list-panel.tsx`:
Tambahkan `Building2` dan `Wrench` ke dalam import `lucide-react`.

- [ ] **Step 2: Tambahkan state `selectedObjectType` dan pending counters**

```tsx
type ObjectTypeFilter = "EQUIPMENT" | "ROOM"
```
Di dalam fungsi `TodoListPanel`:
```tsx
const [selectedObjectType, setSelectedObjectType] = React.useState<ObjectTypeFilter>("EQUIPMENT")

const equipmentPendingCount = React.useMemo(
  () => tasks.filter((t) => t.objectType === "EQUIPMENT" && t.status !== "COMPLETED").length,
  [tasks],
)
const roomPendingCount = React.useMemo(
  () => tasks.filter((t) => t.objectType === "ROOM" && t.status !== "COMPLETED").length,
  [tasks],
)
```

- [ ] **Step 3: Tambahkan filter `objectType` ke dalam `filteredTasks` dan dependency `useEffect` paginasi**

Di dalam `filteredTasks`:
```tsx
// Filter by objectType (Equipment vs Room)
if (task.objectType !== selectedObjectType) return false
```
Dan di `useEffect` reset halaman:
```tsx
React.useEffect(() => {
  setCurrentPage(1)
}, [activeTab, searchQuery, selectedObjectType])
```

- [ ] **Step 4: Render Segmented Control tepat di bawah search bar**

Tepat di bawah kontainer search input (di dalam container filter):
```tsx
{/* Row 3: Segmented Control (Equipment vs Ruangan) */}
<div className="flex rounded-xl bg-slate-200/70 p-1 border border-slate-200">
  <button
    type="button"
    onClick={() => setSelectedObjectType("EQUIPMENT")}
    className={cn(
      "flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all",
      selectedObjectType === "EQUIPMENT"
        ? "bg-[#ff8a2a] text-black shadow-xs ring-1 ring-[#ff8a2a]"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
    )}
  >
    <Wrench className="size-3.5" />
    Equipment ({equipmentPendingCount})
  </button>
  <button
    type="button"
    onClick={() => setSelectedObjectType("ROOM")}
    className={cn(
      "flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all",
      selectedObjectType === "ROOM"
        ? "bg-[#ff8a2a] text-black shadow-xs ring-1 ring-[#ff8a2a]"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
    )}
  >
    <Building2 className="size-3.5" />
    Ruangan ({roomPendingCount})
  </button>
</div>
```

- [ ] **Step 5: Verifikasi typecheck dan runtime**

Jalankan typecheck untuk memastikan tidak ada kesalahan TypeScript:
`npm run typecheck`
Verifikasi tampilan di browser bahwa default Equipment aktif dan jumlah pending tampil sesuai.
