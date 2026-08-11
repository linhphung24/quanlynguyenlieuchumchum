USE ChumChumDB;
GO

DECLARE @ConstraintName nvarchar(200)
SELECT @ConstraintName = Name 
FROM sys.check_constraints
WHERE parent_object_id = object_id('Users') 
  AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = object_id('Users') AND name = 'Role')

IF @ConstraintName IS NOT NULL
BEGIN
    DECLARE @SQL nvarchar(1000) = 'ALTER TABLE Users DROP CONSTRAINT ' + @ConstraintName
    EXEC(@SQL)
END
GO

ALTER TABLE Users ADD CHECK (Role IN ('admin', 'manager', 'staff', 'ketoan', 'thukho'));
GO
