import sys

with open('src/components/ParentDashboard.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

bad_block = '''                        );
                      }
                    })
                  })()}'''

good_block = '''                        );
                      }
                    })
                  )}'''

code = code.replace(bad_block, good_block)

with open('src/components/ParentDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

