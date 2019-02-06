DECLARE @PageNumber AS INT, @RowspPage AS INT
SET @PageNumber = '+(OptInt(PAGING.INDEX,0)+1)+'
SET @RowspPage = '+PAGING.SIZE+';
WITH ordered_data AS (' + sqlExecute + whereSql + ')
SELECT * FROM ordered_data O
WHERE O.row_num BETWEEN ((@PageNumber - 1) * @RowspPage + 1) AND (@PageNumber * @RowspPage) order by row_num
