"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/server/auth";
import { createCustomer, CustomerError, updateCustomer } from "@/lib/server/customers";

export type CustomerFormState = { error?: string; ok?: boolean; values?: ReturnType<typeof readForm> };

function readForm(fd: FormData) {
  return {
    name: String(fd.get("name") ?? ""),
    phone: String(fd.get("phone") ?? ""),
    address: String(fd.get("address") ?? ""),
    notes: String(fd.get("notes") ?? ""),
  };
}

export async function createCustomerAction(_p: CustomerFormState, fd: FormData): Promise<CustomerFormState> {
  if (!(await getCurrentUser())) return { error: "Sesi berakhir. Silakan login ulang." };
  let id: number;
  try {
    id = await createCustomer(readForm(fd));
  } catch (e) {
    if (e instanceof CustomerError) return { error: e.message, values: readForm(fd) };
    console.error("createCustomerAction", e);
    return { error: "Gagal menyimpan konsumen.", values: readForm(fd) };
  }
  redirect(`/admin/customers/${id}`);
}

export async function updateCustomerAction(_p: CustomerFormState, fd: FormData): Promise<CustomerFormState> {
  if (!(await getCurrentUser())) return { error: "Sesi berakhir. Silakan login ulang." };
  try {
    await updateCustomer(Number(fd.get("id")), readForm(fd));
  } catch (e) {
    if (e instanceof CustomerError) return { error: e.message, values: readForm(fd) };
    console.error("updateCustomerAction", e);
    return { error: "Gagal menyimpan perubahan.", values: readForm(fd) };
  }
  refresh();
  return { ok: true };
}
