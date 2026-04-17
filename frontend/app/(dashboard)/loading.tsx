export default function Loading() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6 animate-pulse">
      <div className="flex items-center justify-between space-y-2">
        <div className="h-10 w-[200px] bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="flex items-center space-x-2">
          <div className="h-10 w-[120px] bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-10 w-[100px] bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <div className="col-span-4 h-[400px] bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="col-span-3 h-[400px] bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
}
