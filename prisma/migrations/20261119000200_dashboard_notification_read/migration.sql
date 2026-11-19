CREATE TABLE "DashboardNoticeRead" (
    "userNik" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "branch" TEXT NOT NULL,
    "noticeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "actionLabel" TEXT NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,
    "readAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DashboardNoticeRead_pkey" PRIMARY KEY ("userNik", "role", "branch", "noticeId"),
    CONSTRAINT "DashboardNoticeRead_userNik_fkey" FOREIGN KEY ("userNik") REFERENCES "User"("NIK") ON DELETE CASCADE ON UPDATE CASCADE
);
