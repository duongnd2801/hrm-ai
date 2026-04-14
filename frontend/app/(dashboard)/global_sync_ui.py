import os

targets = [
    r'c:\Users\duong\OneDrive\Desktop\hrm-ai\frontend\app\(dashboard)\leave\page.tsx',
    r'c:\Users\duong\OneDrive\Desktop\hrm-ai\frontend\app\(dashboard)\apologies\page.tsx',
    r'c:\Users\duong\OneDrive\Desktop\hrm-ai\frontend\app\(dashboard)\ot\page.tsx'
]

for file_path in targets:
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Generic search and replace for the standardized luxury container
    content = content.replace(
        'className="bg-white/90 dark:bg-white/5 backdrop-blur-3xl rounded-[48px] border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-3xl flex flex-col h-full overflow-hidden min-h-[700px]"',
        'className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] p-10 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl flex flex-col h-full overflow-hidden min-h-[700px]"'
    )
    
    # For Leave specifically
    if 'leave' in file_path:
        content = content.replace(
            'group hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors',
            'group hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300'
        )

    # For general rows
    content = content.replace(
        'group hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors',
        'group hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300'
    )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Global sync done.")
