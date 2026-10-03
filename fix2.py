import sys

with open('src/components/ParentDashboard.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

target2_a = '                    })}'
target2_b = '                  })()' + '}'
if target2_a in code:
    code = code.replace(target2_a, target2_b, 1)
    with open('src/components/ParentDashboard.tsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Success replacing target 2")
else:
    print("Target 2 still not found")
