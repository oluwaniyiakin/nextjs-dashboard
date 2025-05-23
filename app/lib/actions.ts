'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';

// Set up Postgres connection
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

/**
 * Validation Schema for invoices
 */
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

// Schema for creating an invoice (no id or date needed)
const CreateInvoice = FormSchema.omit({ id: true, date: true });

// Schema for updating an invoice (id is required, no date)
const UpdateInvoice = FormSchema.omit({ date: true });

/**
 * Server Action: createInvoice
 */
export async function createInvoice(formData: FormData) {
  try {
    const { customerId, amount, status } = CreateInvoice.parse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    console.error('Failed to create invoice:', error);
    throw error;
  }

  // redirect throws an internal error to trigger navigation, so call it after try/catch
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

/**
 * Server Action: deleteInvoice
 */
export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (error) {
    console.error('Failed to delete invoice:', error);
    throw error;
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

/**
 * Server Action: updateInvoice
 */
export async function updateInvoice(formData: FormData) {
  try {
    const { id, customerId, amount, status } = UpdateInvoice.parse({
      id: formData.get('id'),
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });

    const amountInCents = amount * 100;

    await sql`
      UPDATE invoices
      SET customer_id = ${customerId},
          amount = ${amountInCents},
          status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error('Failed to update invoice:', error);
    throw error;
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
