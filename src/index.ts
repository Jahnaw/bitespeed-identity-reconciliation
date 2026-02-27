import express from "express";
import { prisma } from "./prisma";

const app = express();
const PORT = 3000;

app.use(express.json());

app.post("/identify", async (req, res) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).json({
      error: "Either email or phoneNumber must be provided",
    });
  }

  
  const matchingContacts = await prisma.contact.findMany({
    where: {
      OR: [
        email ? { email } : undefined,
        phoneNumber ? { phoneNumber } : undefined,
      ].filter(Boolean) as any,
    },
    orderBy: { createdAt: "asc" },
  });

  
  if (matchingContacts.length === 0) {
    const primary = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: "primary",
      },
    });

    return res.status(200).json({
      contact: {
        primaryContactId: primary.id,
        emails: primary.email ? [primary.email] : [],
        phoneNumbers: primary.phoneNumber ? [primary.phoneNumber] : [],
        secondaryContactIds: [],
      },
    });
  }

  
  const primaryContacts = matchingContacts.filter(
    (c) => c.linkPrecedence === "primary"
  );

  const oldestPrimary = primaryContacts[0];

  
  if (primaryContacts.length > 1) {
    for (const contact of primaryContacts.slice(1)) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          linkPrecedence: "secondary",
          linkedId: oldestPrimary.id,
        },
      });
    }
  }

  
  const hasNewEmail =
    email && !matchingContacts.some((c) => c.email === email);

  const hasNewPhone =
    phoneNumber &&
    !matchingContacts.some((c) => c.phoneNumber === phoneNumber);

  if (hasNewEmail || hasNewPhone) {
    await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: "secondary",
        linkedId: oldestPrimary.id,
      },
    });
  }

  
  const allContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: oldestPrimary.id },
        { linkedId: oldestPrimary.id },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

 
  const emails = [
    ...new Set(allContacts.map((c) => c.email).filter(Boolean)),
  ] as string[];

  const phoneNumbers = [
    ...new Set(allContacts.map((c) => c.phoneNumber).filter(Boolean)),
  ] as string[];

  const secondaryContactIds = allContacts
    .filter((c) => c.linkPrecedence === "secondary")
    .map((c) => c.id);

  return res.status(200).json({
    contact: {
      primaryContactId: oldestPrimary.id,
      emails,
      phoneNumbers,
      secondaryContactIds,
    },
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});