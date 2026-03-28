import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { PrismaClient } from "@prisma/client";
import redis from "../config/redis.js";

const prisma = new PrismaClient({});

/**
 * @desc    Get all patients for the current hospital
 * @route   GET /api/patients
 * @access  Private
 */
export const getAllPatients = asyncHandler(async (req, res) => {
  const supabase_id = req.user.id;

  try {
    const hospital = await prisma.hospital.findUnique({
      where: { supabase_id },
    });

    if (!hospital) {
      throw new ApiError(404, "Hospital not found for this user");
    }

    const patients = await prisma.patient.findMany({
      where: { hospital_id: hospital.id },
      include: {
        doctor: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, patients, "Patients retrieved successfully"));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Error fetching patients from Database", [
      error.message,
    ]);
  }
});

/**
 * @desc    Add a new patient
 * @route   POST /api/patients
 * @access  Private
 */
export const addPatient = asyncHandler(async (req, res) => {
  const {
    name,
    phone_number,
    language_preference,
    primary_diagnosis,
    doctor_id,
  } = req.body;
  const supabase_id = req.user.id;

  if (!name || !phone_number) {
    throw new ApiError(400, "Name and Phone Number are required fields");
  }

  try {
    const hospital = await prisma.hospital.findUnique({
      where: { supabase_id },
    });

    if (!hospital) {
      throw new ApiError(
        404,
        "Hospital not found for this user. Please register first.",
      );
    }

    const patient = await prisma.patient.create({
      data: {
        name,
        phone_number,
        language_preference: language_preference || "Hindi",
        primary_diagnosis: primary_diagnosis || "General",
        hospital_id: hospital.id,
        doctor_id: doctor_id || null,
      },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, patient, "Patient added successfully"));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Error inserting patient into database", [
      error.message,
    ]);
  }
});
