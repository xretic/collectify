-- AlterTable
CREATE SEQUENCE admin_id_seq;
ALTER TABLE "Admin" ALTER COLUMN "id" SET DEFAULT nextval('admin_id_seq');
ALTER SEQUENCE admin_id_seq OWNED BY "Admin"."id";
