CREATE TABLE "financial_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"remarks" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"recorded_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "group_schedule_assignments" DROP CONSTRAINT "group_schedule_assignments_schedule_cell_id_schedule_cells_id_f";
--> statement-breakpoint
ALTER TABLE "module_years" DROP CONSTRAINT "module_years_module_id_fkey";
--> statement-breakpoint
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_schedule_assignments" ADD CONSTRAINT "group_schedule_assignments_schedule_cell_id_schedule_cells_id_fk" FOREIGN KEY ("schedule_cell_id") REFERENCES "public"."schedule_cells"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_years" ADD CONSTRAINT "module_years_module_id_teaching_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."teaching_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_qr_code_unique" UNIQUE("qr_code");--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_qr_code_unique" UNIQUE("qr_code");