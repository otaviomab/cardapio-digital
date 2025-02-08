-- Cria um token de serviço com permissões para executar SQL
CREATE POLICY "Allow service role to execute SQL"
ON auth.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Habilita o acesso SQL para o token de serviço
ALTER ROLE service_role SET pgrst.db_anon_role = 'service_role'; 