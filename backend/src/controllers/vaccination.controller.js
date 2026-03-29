import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({});

export const getAllVaccinations = asyncHandler(async (req, res) => {
  try {
    const vaccinations = await prisma.vaccinationPatient.findMany({
      orderBy: { created_at: "desc" },
    });

    const mapped = vaccinations.map((v) => ({
      id: v.id,
      child_name: v.name,
      age: v.age,
      parents_number: v.phone_number,
      vaccine_name: v.vaccine_name,
      dose: v.dose,
      next_vaccination_date: v.next_date,
      created_at: v.created_at,
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(200, mapped, "Vaccinations retrieved successfully"),
      );
  } catch (error) {
    throw new ApiError(500, "Error fetching vaccinations from Database", [
      error.message,
    ]);
  }
});

export const addVaccination = asyncHandler(async (req, res) => {
  const name = req.body.child_name || req.body.name;
  const phone_number = req.body.parents_number || req.body.phone_number;
  const age = req.body.age;
  const vaccine_name = req.body.vaccine_name;
  const dose = req.body.dose;
  const next_date = req.body.next_vaccination_date || req.body.next_date;

  if (!name || !phone_number || !vaccine_name || !dose || !next_date) {
    throw new ApiError(
      400,
      "Name, Phone Number, Vaccine Name, Dose and Next Date are required fields",
    );
  }

  try {
    const vaccination = await prisma.vaccinationPatient.create({
      data: {
        name: String(name),
        phone_number: String(phone_number),
        age: String(age),
        vaccine_name: String(vaccine_name),
        dose: String(dose),
        next_date: String(next_date),
      },
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          vaccination,
          "Vaccination record added successfully",
        ),
      );
  } catch (error) {
    throw new ApiError(500, "Error inserting vaccination into database", [
      error.message,
    ]);
  }
});

export const importVaccinations = asyncHandler(async (req, res) => {
  const { data } = req.body;

  console.log("=== INCOMING IMPORT DATA ===");
  console.log(JSON.stringify(data, null, 2));
  console.log("============================");

  if (!data || !Array.isArray(data)) {
    throw new ApiError(400, "Valid data array is required");
  }

  let successCount = 0;

  try {
    for (const row of data) {
      if (!row) continue;

      const normalizeHeader = (value) =>
        String(value ?? "")
          .replace(/[\uFEFF\u200B\u00A0]/g, " ")
          .toLowerCase()
          .replace(/[_\-]+/g, " ")
          .replace(/[^\p{L}\p{N}]+/gu, " ")
          .replace(/\s+/g, " ")
          .trim();

      const toTokens = (value) => {
        const normalized = normalizeHeader(value);
        return normalized ? normalized.split(" ") : [];
      };

      const rowKeys = Object.keys(row);
      const rowKeyTokens = new Map(rowKeys.map((k) => [k, toTokens(k)]));

      const findKey = (expectedKey) => {
        const expectedTokens = toTokens(expectedKey);
        if (expectedTokens.length === 0) return "";

        const exact = rowKeys.find(
          (k) => normalizeHeader(k) === normalizeHeader(expectedKey),
        );
        if (exact) return exact;

        const tokenMatch = rowKeys.find((k) => {
          const tokens = rowKeyTokens.get(k) || [];
          return expectedTokens.every((t) => tokens.includes(t));
        });
        return tokenMatch || "";
      };

      const getVal = (expectedKeys) => {
        for (const expectedKey of expectedKeys) {
          const foundKey = findKey(expectedKey);
          if (!foundKey) continue;
          const value = row[foundKey];
          if (value !== undefined && value !== null && value !== "") {
            return String(value).trim();
          }
        }
        return "";
      };

      const pName = getVal([
        "child_name",
        "child name",
        "name",
        "patient name",
        "first name",
        "patient_name",
        "childname",
      ]);
      const pPhone = getVal([
        "parents_number",
        "parents number",
        "parent number",
        "phone",
        "phone number",
        "phone_number",
        "mobile",
        "contact",
        "mobile number",
        "phone no",
        "phone no.",
        "phone #",
      ]);
      const pAge = getVal(["age", "months", "age (months)"]);
      const pVaccine = getVal([
        "vaccine_name",
        "vaccine name",
        "vaccine",
        "vaccine type",
      ]);
      const pDose = getVal(["dose", "dose number", "dose_number"]);
      const pNextDate = getVal([
        "next_vaccination_date",
        "next vaccination date",
        "next date",
        "date",
        "due date",
      ]);

      if (!pName || !pPhone) continue;

      await prisma.vaccinationPatient.create({
        data: {
          name: pName,
          phone_number: pPhone,
          age: pAge,
          vaccine_name: pVaccine || "Unknown",
          dose: pDose || "1",
          next_date: pNextDate || "N/A",
        },
      });
      successCount++;
    }

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { imported: successCount },
          `Imported ${successCount} records successfully`,
        ),
      );
  } catch (error) {
    throw new ApiError(500, "Error importing vaccinations into database", [
      error.message,
    ]);
  }
});

export const deleteVaccination = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Vaccination id is required");
  }

  try {
    await prisma.vaccinationPatient.delete({ where: { id } });

    return res
      .status(200)
      .json(new ApiResponse(200, { id }, "Vaccination deleted successfully"));
  } catch (error) {
    throw new ApiError(500, "Error deleting vaccination", [error.message]);
  }
});
