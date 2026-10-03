const fs = require('fs');
let code = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

const targetStr = `{course?.modules.map((mod, idx) => {
                    const isCompleted = mod.lessons.length > 0 && mod.lessons.every(l => completedLessonIds.includes(l.id));
                    const prevCompleted = idx === 0 || course.modules[idx - 1].lessons.every(l => completedLessonIds.includes(l.id));
                    const isActive = !isCompleted && prevCompleted;
                    const moduleName = mod.name[lang as keyof typeof mod.name] || mod.name.en;

                    if (isActive) {`;

const replacement = `{(() => {
                    const activeModuleIndex = course?.modules.findIndex(mod => mod.lessons.length > 0 && !mod.lessons.every(l => completedLessonIds.includes(l.id)));
                    const finalActiveModuleIndex = activeModuleIndex === undefined || activeModuleIndex === -1 ? -1 : activeModuleIndex;
                    return course?.modules.map((mod, idx) => {
                      const hasLessons = mod.lessons.length > 0;
                      const isCompleted = hasLessons && mod.lessons.every(l => completedLessonIds.includes(l.id));
                      const isActive = idx === finalActiveModuleIndex;
                      const moduleName = mod.name[lang as keyof typeof mod.name] || mod.name.en;

                      if (isActive) {`;

code = code.replace(targetStr, replacement);

const endTarget = `                        );
                      }
                    })}`;

const endReplacement = `                        );
                      }
                    })})()}`;

code = code.replace(endTarget, endReplacement);

fs.writeFileSync('src/components/ParentDashboard.tsx', code);
