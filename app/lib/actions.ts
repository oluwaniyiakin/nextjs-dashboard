'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
 
// Set up Postgres connection
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// ...
 
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

/**
 * Form state type for form actions
 */
type FormState = {
  message: string | null;
  errors?: {
    customerId?: string;
    amount?: string;
    status?: string;
  };
};

/**
 * Zod validation schema for full invoice shape
 */
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string().min(1, { message: 'Customer is required' }),
  amount: z.coerce.number().gt(0, { message: 'Amount must be greater than 0' }),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

/**
 * Validation schemas for create/update
 */
const CreateInvoiceSchema = FormSchema.omit({ id: true, date: true });
const UpdateInvoiceSchema = FormSchema.omit({ date: true });

/**
 * Server Action: Create Invoice
 */
export async function createInvoice(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const validated = CreateInvoiceSchema.parse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });

    const amountInCents = validated.amount * 100;
    const date = new Date().toISOString().split('T')[0];

    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${validated.customerId}, ${amountInCents}, ${validated.status}, ${date})
    `;

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  } catch (err) {
    if (err instanceof z.ZodError) {
      const fieldErrors = err.flatten().fieldErrors;
      return {
        message: 'Validation failed. Please correct the fields below.',
        errors: {
          customerId: fieldErrors.customerId?.[0],
          amount: fieldErrors.amount?.[0],
          status: fieldErrors.status?.[0],
        },
      };
    }

    console.error('Unexpected error creating invoice:', err);
    return {
      message: 'Something went wrong. Please try again.',
    };
  }
}

/**
 * Server Action: Delete Invoice
 */
export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (err) {
    console.error('Failed to delete invoice:', err);
    throw err;
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

/**
 * Server Action: Update Invoice
 */
export async function updateInvoice(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const validated = UpdateInvoiceSchema.parse({
      id: formData.get('id'),
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });

    const amountInCents = validated.amount * 100;

    await sql`
      UPDATE invoices
      SET customer_id = ${validated.customerId},
          amount = ${amountInCents},
          status = ${validated.status}
      WHERE id = ${validated.id}
    `;

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  } catch (err) {
    if (err instanceof z.ZodError) {
      const fieldErrors = err.flatten().fieldErrors;
      return {
        message: 'Validation failed. Please correct the fields below.',
        errors: {
          customerId: fieldErrors.customerId?.[0],
          amount: fieldErrors.amount?.[0],
          status: fieldErrors.status?.[0],
        },
      };
    }

    console.error('Unexpected error updating invoice:', err);
    return {
      message: 'Something went wrong. Please try again.',
    };
  }
}
