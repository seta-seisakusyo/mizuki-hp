import { getPrismaClient } from "@/lib/db";
import { ContactPayload } from "./types";

const prisma = getPrismaClient();

export async function createInquiry(payload: ContactPayload) {
  return prisma.inquiry.create({
    data: {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      inquiry: payload.inquiry,
    },
  });
}

export async function listInquiries() {
  return prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function removeInquiry(id: number) {
  return prisma.inquiry.delete({ where: { id } });
}
