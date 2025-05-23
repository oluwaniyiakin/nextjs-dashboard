import { notFound } from 'next/navigation'; 
import { sql } from '@vercel/postgres';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import Form from '@/app/ui/invoices/edit-form';

export default async function EditInvoicePage({ params }) {
  const id = params.id;

  // Fetch invoice and customers concurrently
  const [invoiceResult, customersResult] = await Promise.all([
    sql`
      SELECT id, customer_id, amount, status
      FROM invoices
      WHERE id = ${id}
    `,
    sql`
      SELECT id, name
      FROM customers
      ORDER BY name ASC
    `,
  ]);

  const invoice = invoiceResult.rows[0];
  const customers = customersResult.rows;

  // If invoice not found, trigger 404 page
  if (!invoice) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Edit Invoice',
            href: `/dashboard/invoices/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form invoice={invoice} customers={customers} />
    </main>
  );
}
