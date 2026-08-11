export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#2EC4B6]/20 border-t-[#2EC4B6] rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
