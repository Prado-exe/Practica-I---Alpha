ALTER TABLE accounts
ADD CONSTRAINT fk_accounts_institution
FOREIGN KEY (institution_id)
REFERENCES institutions(institution_id)
ON DELETE SET NULL 
ON UPDATE CASCADE;