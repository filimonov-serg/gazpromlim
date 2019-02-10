INNER JOIN ( 
  SELECT 
    do.evDoc.value('(start_date)[1]', 'datetime') as p_start_date
    ,do.evDoc.value('(finish_date)[1]', 'datetime') as p_finihs_date 
    --,do.evDoc.value('(object_resource_id)[1]', 'bigint') as ores_id 
    ,do.evDoc.value('(lector_id)[1]', 'bigint') as lector_id 
    ,do.evDoc.value('(comment)[1]','nvarchar(max)') as phase_name 
    ,e.id as event_id 
    ,case when RIGHT(do.evDoc.value('(comment)[1]','nvarchar(max)'), 4)='flow' THEN 1 ELSE 0 END as is_flow 
  FROM event e 
  CROSS APPLY e.data.nodes('/event/phases/phase') as do(evDoc) 
) ev_phases ON ev_phases.event_id=evs.id
