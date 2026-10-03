import sys

with open('src/components/ParentDashboard.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

target = '''                            <h4 className="text-lg font-bold leading-tight m-0 opacity-60">{moduleName}</h4>
                            <p className="text-sm text-[#FFD166] mt-1.5 font-bold m-0 font-mono">Coming Soon</p>
                          </div>
                        </div>
                      );
                    }
                  })}'''

repl = '''                            <h4 className="text-lg font-bold leading-tight m-0 opacity-60">{moduleName}</h4>
                            <p className="text-sm text-[#FFD166] mt-1.5 font-bold m-0 font-mono">Coming Soon</p>
                          </div>
                        </div>
                      );
                    }
                  })
                  })()}'''

if target in code:
    code = code.replace(target, repl)
    with open('src/components/ParentDashboard.tsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Success")
else:
    print("Not found")
