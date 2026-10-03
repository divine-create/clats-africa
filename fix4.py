import sys

with open('src/components/ParentDashboard.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix ParentDashboard.tsx extra brace
bad_block = '''                      }
                    })
                  })()}
                  )}'''

good_block = '''                      }
                    })
                  })()}'''

code = code.replace(bad_block, good_block)

# Just fix the whole file to make sure
bad_block2 = '''                      }
                    })
                  })()
                  )}'''

code = code.replace(bad_block2, good_block)

with open('src/components/ParentDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

