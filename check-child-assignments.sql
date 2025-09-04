-- Query to check child assignments and their userId values
-- This will help us understand if children assignments have proper userId populated

SELECT 
    gma."groupId",
    gma."studentId",
    gma."userId", 
    gma."studentType",
    CASE 
        WHEN gma."studentType" = 'child' THEN c.name
        WHEN gma."studentType" = 'student' THEN s.name
    END as student_name,
    CASE 
        WHEN gma."studentType" = 'child' THEN c."parentId"
        WHEN gma."studentType" = 'student' THEN s."userId"
    END as expected_userId,
    CASE 
        WHEN gma."studentType" = 'child' AND gma."userId" = c."parentId" THEN '✅'
        WHEN gma."studentType" = 'student' AND gma."userId" = s."userId" THEN '✅'
        ELSE '❌'
    END as userId_status
FROM "groupMixedAssignments" gma
LEFT JOIN "children" c ON gma."studentType" = 'child' AND gma."studentId" = c.id
LEFT JOIN "students" s ON gma."studentType" = 'student' AND gma."studentId" = s.id
WHERE gma."groupId" IN (
    SELECT g.id 
    FROM "groups" g 
    WHERE g."schoolId" = 4 
    LIMIT 5
)
ORDER BY gma."groupId", gma."studentType", student_name;