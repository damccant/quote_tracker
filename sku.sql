SELECT t.deviation_id, t.price, t.total, a.allocated, t.total - a.allocated AS floating, s.sold
FROM (
    SELECT deviation_id, SUM(qty) AS total, MAX(price) AS price FROM deviations_skus WHERE sku = $1 GROUP BY deviation_id
) AS t
FULL JOIN (
    SELECT deviation_id, SUM(job_skus.qty) AS allocated FROM job_skus LEFT JOIN jobs ON job_skus.job_name = jobs.name WHERE sku = $1 GROUP BY deviation_id
) AS a
ON t.deviation_id = a.deviation_id
FULL JOIN (
    SELECT deviation_id, SUM(sales_tickets_skus.qty) AS sold
        FROM sales_tickets_skus
        LEFT JOIN sales_tickets ON sales_tickets.id = sales_tickets_skus.sales_ticket
        LEFT JOIN jobs ON jobs.name = sales_tickets.job_name
        WHERE sku = $1
        GROUP BY deviation_id
    ) AS s
ON t.deviation_id = s.deviation_id;