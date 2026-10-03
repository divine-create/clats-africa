import sys

with open('src/components/ParentDashboard.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

target = '''                  {course?.modules.map((mod, idx) => {
                    const isCompleted = mod.lessons.length > 0 && mod.lessons.every(l => completedLessonIds.includes(l.id));
                    const prevCompleted = idx === 0 || course.modules[idx - 1].lessons.every(l => completedLessonIds.includes(l.id));
                    const isActive = !isCompleted && prevCompleted;
                    const moduleName = mod.name[lang as keyof typeof mod.name] || mod.name.en;'''

repl = '''                  {(() => {
                    const activeModuleIndex = course?.modules.findIndex(mod => mod.lessons.length > 0 && !mod.lessons.every(l => completedLessonIds.includes(l.id)));
                    const finalActiveModuleIndex = activeModuleIndex === undefined || activeModuleIndex === -1 ? -1 : activeModuleIndex;
                    return course?.modules.map((mod, idx) => {
                      const hasLessons = mod.lessons.length > 0;
                      const isCompleted = hasLessons && mod.lessons.every(l => completedLessonIds.includes(l.id));
                      const isActive = idx === finalActiveModuleIndex;
                      const moduleName = mod.name[lang as keyof typeof mod.name] || mod.name.en;'''

idx1 = code.find(target)
if idx1 != -1:
    idx2 = code.find('                    })', idx1)
    if idx2 != -1:
        new_code = code[:idx1] + repl + code[idx1+len(target):idx2] + '                    })\n                  })()' + code[idx2+22:]
        with open('src/components/ParentDashboard.tsx', 'w', encoding='utf-8') as f:
            f.write(new_code)
        print("Success")
    else:
        print("End not found")
else:
    print("Start not found")
