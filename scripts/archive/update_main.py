with open('app/main.py', 'r', encoding='utf-8') as f:
    code = f.read()

target = 'app.include_router(protege.router)  # Phase 4: Protege Effect'
if 'GuruCortex 2.0 Master Routers' not in code and target in code:
    injection = '''app.include_router(protege.router)  # Phase 4: Protege Effect
except Exception as e:
    print(f"Warning: Could not load protege router: {e}")

# GuruCortex 2.0 Master Routers
try:
    from app.routers import visual_intelligence, revision, coach, career, focus, parent, institution
    app.include_router(visual_intelligence.router)
    app.include_router(revision.router)
    app.include_router(coach.router)
    app.include_router(career.router)
    app.include_router(focus.router)
    app.include_router(parent.router)
    app.include_router(institution.router)
except Exception as e:
    print(f"Warning: Could not load some GuruCortex 2.0 routers: {e}")
'''
    old_block = '''app.include_router(protege.router)  # Phase 4: Protege Effect
except Exception as e:
    print(f"Warning: Could not load protege router: {e}")'''
    code = code.replace(old_block, injection)
    with open('app/main.py', 'w', encoding='utf-8') as f:
        f.write(code)
    print("SUCCESS: main.py updated!")
else:
    print("Already updated or target not found.")
