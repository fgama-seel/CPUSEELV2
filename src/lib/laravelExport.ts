/**
 * Gerador de arquivos para Laravel 10/11 com MySQL
 * Produz migrations, models e seeders prontos com passo a passo didático.
 */

export function generateLaravelMigration(): string {
  return `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * O QUE FAZER: Coloque este arquivo em /database/migrations/2026_10_30_000001_create_obras_and_cpus_tables.php
     * E rode no terminal: php artisan migrate
     */
    public function up(): void
    {
        // 1. Tabela de Obras
        Schema::create('obras', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('codigo', 50);
            $table->string('nome');
            $table->string('cliente')->nullable();
            $table->decimal('bdi', 8, 4)->default(25.0);
            $table->decimal('custo_indireto_atual', 15, 2)->default(0.0);
            $table->decimal('faturamento_direto_atual', 15, 2)->default(0.0);
            $table->timestamps();
        });

        // 2. Tabela de Insumos Base
        Schema::create('insumos', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('obra_id', 64);
            $table->string('id_insumo', 64);
            $table->string('tipo', 50);
            $table->string('descricao');
            $table->string('unid', 20);
            $table->decimal('pr_unit', 15, 4)->default(0.0);
            $table->timestamps();

            $table->foreign('obra_id')->references('id')->on('obras')->onDelete('cascade');
        });

        // 3. Tabela de CPUs
        Schema::create('cpus', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('obra_id', 64);
            $table->string('code', 64);
            $table->string('nome');
            $table->string('unidade', 20);
            $table->decimal('prod_teorica', 12, 4)->default(1.0);
            $table->decimal('praticabilidade', 8, 4)->default(1.0);
            $table->decimal('horas_dia', 8, 4)->default(8.8);
            $table->decimal('prod_efetiva', 12, 4)->default(1.0);
            $table->decimal('quantidade_prevista', 15, 4)->default(1.0);
            $table->decimal('preco_venda', 15, 4)->default(0.0);
            $table->boolean('venda_definida')->default(false);
            $table->decimal('fator_fcd', 10, 4)->default(1.0);
            $table->timestamps();

            $table->foreign('obra_id')->references('id')->on('obras')->onDelete('cascade');
        });

        // 4. Insumos da CPU (Composição)
        Schema::create('cpu_insumos', function (Blueprint $table) {
            $table->id();
            $table->string('cpu_id', 64);
            $table->string('id_insumo', 64);
            $table->string('tipo', 50);
            $table->string('descricao');
            $table->string('unid', 20);
            $table->decimal('coef', 15, 6)->default(0.0);
            $table->decimal('pr_unit', 15, 4)->default(0.0);

            $table->foreign('cpu_id')->references('id')->on('cpus')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cpu_insumos');
        Schema::dropIfExists('cpus');
        Schema::dropIfExists('insumos');
        Schema::dropIfExists('obras');
    }
};
`;
}

export function generateGuiaMigracaoLaravel(): string {
  return `# GUIA DE MIGRAÇÃO: FIREBASE -> LARAVEL + MYSQL NO SERVIDOR DA EMPRESA

Olá! Este guia foi feito especialmente para você que tem pouca experiência em Laravel e MySQL.
Siga os 4 passos abaixo com calma. Cada passo explica o que fazer e onde colocar cada arquivo.

---

### PASSO 1: Configurar a Conexão com o MySQL da Empresa no Laravel
No seu projeto Laravel, existe um arquivo chamado \`.env\` na pasta raiz.
Abra esse arquivo e procure as linhas de banco de dados. Preencha com os dados do servidor MySQL da empresa:

\`\`\`env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1      # Ou o IP do servidor da sua empresa
DB_PORT=3306
DB_DATABASE=seel_obras # Nome do banco que você criou no MySQL
DB_USERNAME=root       # Seu usuário do MySQL
DB_PASSWORD=suasenha   # Sua senha do MySQL
\`\`\`

---

### PASSO 2: O que fazer com o arquivo .SQL gerado
Se você baixou o arquivo **importar_seel_mysql.sql**:
1. Abra o gerenciador do MySQL da empresa (pode ser o **phpMyAdmin**, **HeidiSQL**, **DBeaver** ou **MySQL Workbench**).
2. Selecione o banco de dados que você criou (ex: \`seel_obras\`).
3. Vá na aba **Importar** (ou **SQL**).
4. Selecione o arquivo \`importar_seel_mysql.sql\` ou cole todo o texto e clique em **Executar** / **Run**.
5. PRONTO! Todas as tabelas (\`obras\`, \`cpus\`, \`insumos\`, \`cpu_insumos\`) e todos os dados foram salvos!

---

### PASSO 3: Criar as Models no Laravel (se quiser usar Eloquent ORM)
No terminal da pasta do seu projeto Laravel, rode:
\`\`\`bash
php artisan make:model Obra
php artisan make:model CPU
php artisan make:model Insumo
\`\`\`

No model \`app/Models/CPU.php\`, você pode relacionar com os insumos:
\`\`\`php
namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class CPU extends Model
{
    protected $table = 'cpus';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $guarded = [];

    public function insumos()
    {
        return $this->hasMany(CpuInsumo::class, 'cpu_id', 'id');
    }

    public function obra()
    {
        return $this->belongsTo(Obra::class, 'obra_id', 'id');
    }
}
\`\`\`

---

### DÚVIDAS OU AJUDA?
Se travar em algum comando, basta copiar o erro e me mandar que eu te mostro exatamente o que digitar!
`;
}
