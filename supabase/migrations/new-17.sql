ALTER TABLE home_banners 
DROP CONSTRAINT IF EXISTS home_banners_position_check;

ALTER TABLE home_banners 
ADD CONSTRAINT home_banners_position_check 
CHECK (position IN ('top', 'top_slider', 'carousel', 'middle', 'middle_1', 'middle_2', 'middle_3', 'bottom'));
