from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings as app_settings
from .routers import auth, dashboard, aft, ifw, bvm, scc, settings
from .routers.modules import avs_router, cmt_router, dar_router, pcr_router, s71_router, pkd_router, erp_router, users_router

app = FastAPI(
    title=app_settings.APP_NAME,
    version=app_settings.APP_VERSION,
    description="Public Sector Financial Governance Suite"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core routes
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(users_router)
app.include_router(settings.router)

# Domain A - Audit Readiness
app.include_router(aft.router)
app.include_router(avs_router)

# Domain B - Financial Control
app.include_router(bvm.router)
app.include_router(ifw.router)

# Domain C - Reporting
app.include_router(s71_router)
app.include_router(pkd_router)
app.include_router(erp_router)

# Domain D - Compliance
app.include_router(scc.router)
app.include_router(cmt_router)
app.include_router(dar_router)
app.include_router(pcr_router)


@app.get("/")
def root():
    return {
        "application": app_settings.APP_NAME,
        "version": app_settings.APP_VERSION,
        "suite": "Public Sector Financial Governance Suite",
        "status": "operational",
    }


@app.get("/api/health")
def health():
    return {"status": "healthy", "version": app_settings.APP_VERSION}
