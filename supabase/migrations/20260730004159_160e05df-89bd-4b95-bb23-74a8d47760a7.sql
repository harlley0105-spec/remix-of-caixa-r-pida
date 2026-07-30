CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  category text NOT NULL,
  month_ref date NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::date,
  limit_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, category, month_ref)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT ALL ON public.budgets TO service_role;

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company scoped" ON public.budgets FOR ALL TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();