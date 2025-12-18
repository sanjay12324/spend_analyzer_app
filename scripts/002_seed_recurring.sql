-- Seed default recurring rules for a user
-- Note: This will be run after authentication is setup
-- Users will get these preloaded categories when they sign up

-- This script creates a function to initialize default recurring rules
CREATE OR REPLACE FUNCTION initialize_default_recurring_rules(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Daily recurring items
  INSERT INTO public.recurring_rules (user_id, label, default_amount, unit, frequency, active)
  VALUES 
    (p_user_id, 'Milk', 30, 'bottle', 'daily', true),
    (p_user_id, 'Curd', 20, 'cup', 'daily', true),
    (p_user_id, 'Coffee powder', 50, 'packet', 'daily', false),
    (p_user_id, 'Biscuits', 20, 'packet', 'daily', false),
    (p_user_id, 'Lemon', 5, 'piece', 'daily', false),
    (p_user_id, 'Grocery (Daily)', NULL, NULL, 'daily', false);
  
  -- Weekly recurring items
  INSERT INTO public.recurring_rules (user_id, label, default_amount, unit, frequency, active)
  VALUES 
    (p_user_id, 'Keerai', 20, 'bunch', 'weekly', false),
    (p_user_id, 'Vegetables', NULL, NULL, 'weekly', true),
    (p_user_id, 'Fruits', NULL, NULL, 'weekly', false),
    (p_user_id, 'Non-veg', NULL, NULL, 'weekly', false),
    (p_user_id, 'Snacks', 100, NULL, 'weekly', false),
    (p_user_id, 'Fast food', 200, NULL, 'weekly', false),
    (p_user_id, 'Ghee', 350, 'bottle', 'weekly', false),
    (p_user_id, 'Egg', 60, 'dozen', 'weekly', false),
    (p_user_id, 'Coconut', 20, 'piece', 'weekly', false),
    (p_user_id, 'Grocery (Weekly)', NULL, NULL, 'weekly', false);
  
  -- Monthly recurring items
  INSERT INTO public.recurring_rules (user_id, label, default_amount, unit, frequency, active)
  VALUES 
    (p_user_id, 'Rice', 2000, 'kg', 'monthly', true),
    (p_user_id, 'Cooking oils', 500, 'litre', 'monthly', true),
    (p_user_id, 'Ration', 1500, NULL, 'monthly', false),
    (p_user_id, 'Groceries', 3000, NULL, 'monthly', true),
    (p_user_id, 'Cylinder', 900, NULL, 'monthly', false),
    (p_user_id, 'Electricity', 800, NULL, 'monthly', true),
    (p_user_id, 'House rent', 10000, NULL, 'monthly', true),
    (p_user_id, 'Veranda race course savings', 1000, NULL, 'monthly', false),
    (p_user_id, 'BBA savings', 2000, NULL, 'monthly', false);
END;
$$;
