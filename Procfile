web: node backend/dist/index.js
release: npx prisma migrate deploy --schema backend/prisma/schema.prisma && node backend/dist/scripts/post-release.js
