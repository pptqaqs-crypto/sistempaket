/*
# Migration: Create Database Functions

1. generate_kode_paket - Auto-generates package code PKT-YYYYMMDD-XXXX
2. get_dashboard_stats - Returns dashboard statistics
3. get_paket_harian - Returns daily package counts for chart
4. get_paket_bulanan - Returns monthly package counts for chart
5. get_paket_terlama_belum_diambil - Returns oldest uncollected packages
*/

CREATE OR REPLACE FUNCTION generate_kode_paket()
RETURNS text AS $$
DECLARE
    prefix text;
    sequence_num int;
    new_kode text;
BEGIN
    prefix := 'PKT-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-';
    SELECT COALESCE(MAX(CAST(SUBSTRING(kode_paket FROM LENGTH(prefix) + 1) AS integer)), 0) + 1
    INTO sequence_num
    FROM paket
    WHERE kode_paket LIKE prefix || '%';
    new_kode := prefix || LPAD(sequence_num::text, 4, '0');
    RETURN new_kode;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    total_hari_ini bigint,
    belum_diambil bigint,
    sudah_diambil bigint,
    total_bulan_ini bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM paket WHERE DATE(tanggal_masuk) = CURRENT_DATE)::bigint as total_hari_ini,
        (SELECT COUNT(*) FROM paket WHERE status = 'Menunggu Diambil')::bigint as belum_diambil,
        (SELECT COUNT(*) FROM paket WHERE status = 'Sudah Diambil')::bigint as sudah_diambil,
        (SELECT COUNT(*) FROM paket WHERE EXTRACT(YEAR FROM tanggal_masuk) = EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(MONTH FROM tanggal_masuk) = EXTRACT(MONTH FROM CURRENT_DATE))::bigint as total_bulan_ini;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_paket_harian()
RETURNS TABLE (
    tanggal date,
    total bigint,
    diambil bigint,
    belum_diambil bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(p.tanggal_masuk) as tanggal,
        COUNT(*)::bigint as total,
        COUNT(*) FILTER (WHERE p.status = 'Sudah Diambil')::bigint as diambil,
        COUNT(*) FILTER (WHERE p.status = 'Menunggu Diambil')::bigint as belum_diambil
    FROM paket p
    WHERE p.tanggal_masuk >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(p.tanggal_masuk)
    ORDER BY tanggal;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_paket_bulanan()
RETURNS TABLE (
    bulan text,
    total bigint,
    diambil bigint,
    belum_diambil bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_char(DATE_TRUNC('month', p.tanggal_masuk), 'YYYY-MM') as bulan,
        COUNT(*)::bigint as total,
        COUNT(*) FILTER (WHERE p.status = 'Sudah Diambil')::bigint as diambil,
        COUNT(*) FILTER (WHERE p.status = 'Menunggu Diambil')::bigint as belum_diambil
    FROM paket p
    WHERE p.tanggal_masuk >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')
    GROUP BY DATE_TRUNC('month', p.tanggal_masuk)
    ORDER BY bulan;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_paket_terlama_belum_diambil(limit_count int DEFAULT 10)
RETURNS TABLE (
    id uuid,
    kode_paket text,
    nama_santri text,
    kelas text,
    asrama text,
    ekspedisi text,
    tanggal_masuk timestamptz,
    hari_tertunda bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.kode_paket,
        s.nama as nama_santri,
        s.kelas,
        s.asrama,
        p.ekspedisi,
        p.tanggal_masuk,
        EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p.tanggal_masuk))::bigint as hari_tertunda
    FROM paket p
    JOIN santri s ON p.santri_id = s.id
    WHERE p.status = 'Menunggu Diambil'
    ORDER BY p.tanggal_masuk ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
