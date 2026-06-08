export function up(knex) {
  return knex.schema
    // 1. Tenants
    .createTable('tenants', (table) => {
      table.string('id', 36).primary();
      table.string('name', 255).notNullable();
      table.string('slug', 100).unique().notNullable();
      table.string('status', 50).notNullable().defaultTo('active');
      table.timestamps(true, true);
    })
    // 2. Users
    .createTable('users', (table) => {
      table.string('id', 36).primary();
      table.string('tenant_id', 36).notNullable().references('id').inTable('tenants').onDelete('CASCADE');
      table.string('email', 255).notNullable();
      table.string('password_hash', 255).notNullable();
      table.string('name', 255).notNullable();
      table.string('status', 50).notNullable().defaultTo('active');
      table.timestamps(true, true);
      table.unique(['tenant_id', 'email']);
    })
    // 3. Permissions
    .createTable('permissions', (table) => {
      table.string('id', 100).primary();
      table.string('name', 255).notNullable();
      table.text('description');
      table.string('module', 100).notNullable();
    })
    // 4. Roles
    .createTable('roles', (table) => {
      table.string('id', 36).primary();
      table.string('tenant_id', 36).notNullable().references('id').inTable('tenants').onDelete('CASCADE');
      table.string('name', 100).notNullable();
      table.text('description');
      table.boolean('is_system').notNullable().defaultTo(false);
      table.timestamps(true, true);
      table.unique(['tenant_id', 'name']);
    })
    // 5. Role Permissions (Many-to-Many)
    .createTable('role_permissions', (table) => {
      table.string('role_id', 36).notNullable().references('id').inTable('roles').onDelete('CASCADE');
      table.string('permission_id', 100).notNullable().references('id').inTable('permissions').onDelete('CASCADE');
      table.primary(['role_id', 'permission_id']);
    })
    // 6. User Roles (Many-to-Many)
    .createTable('user_roles', (table) => {
      table.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('role_id', 36).notNullable().references('id').inTable('roles').onDelete('CASCADE');
      table.primary(['user_id', 'role_id']);
    })
    // 7. Audit Logs
    .createTable('audit_logs', (table) => {
      table.string('id', 36).primary();
      table.string('tenant_id', 36).notNullable().references('id').inTable('tenants').onDelete('CASCADE');
      table.string('user_id', 36).nullable().references('id').inTable('users').onDelete('SET NULL');
      table.string('user_email', 255).nullable();
      table.string('action', 100).notNullable();
      table.string('resource', 100).notNullable();
      table.string('resource_id', 100).nullable();
      table.string('status', 50).notNullable();
      table.string('ip_address', 45).notNullable();
      table.text('user_agent').nullable();
      table.json('payload').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
}

export function down(knex) {
  return knex.schema
    .dropTableIfExists('audit_logs')
    .dropTableIfExists('user_roles')
    .dropTableIfExists('role_permissions')
    .dropTableIfExists('roles')
    .dropTableIfExists('permissions')
    .dropTableIfExists('users')
    .dropTableIfExists('tenants');
}
