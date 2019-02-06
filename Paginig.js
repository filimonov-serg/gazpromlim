//Get total rows
qryTotal = 'sql: WITH ordered_data AS ('+sql+whereSql+') SELECT COUNT(*) as cnt FROM ordered_data';
PAGING.TOTAL = OptInt(ArrayFirstElem(XQuery(qryTotal)).cnt, 0);
                
                                    
DECLARE @PageNumber AS INT, @RowspPage AS INT
SET @PageNumber = '+(OptInt(PAGING.INDEX,0)+1)+'
SET @RowspPage = '+PAGING.SIZE+';
WITH ordered_data AS (SELECT ROW_NUMBER() OVER(ORDER BY r.name ASC) AS row_num, r.id, r.name from items r)
SELECT * FROM ordered_data O
WHERE O.row_num BETWEEN ((@PageNumber - 1) * @RowspPage + 1) AND (@PageNumber * @RowspPage) order by row_num
