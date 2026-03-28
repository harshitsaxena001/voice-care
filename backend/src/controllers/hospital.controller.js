import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({});

/**
 * @desc    Register a new hospital (links Supabase UID to Hospital model)
 * @route   POST /api/hospitals/register
 * @access  Private (Authenticated via Supabase)
 */
export const registerHospital = asyncHandler(async (req, res) => {
  const { name, email, phone, address } = req.body;
  const supabase_id = req.user.id;

  if (!name || !email) {
    throw new ApiError(400, "Hospital name and email are required");
  }

  try {
    // Check if hospital already exists for this user
    let hospital = await prisma.hospital.findUnique({
      where: { supabase_id },
    });

    if (hospital) {
      throw new ApiError(400, "Hospital already registered for this user");
    }

    hospital = await prisma.hospital.create({
      data: {
        supabase_id,
        name,
        email,
        phone,
        address,
      },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, hospital, "Hospital registered successfully"));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Error registering hospital", [error.message]);
  }
});

/**
 * @desc    Get current hospital details
 * @route   GET /api/hospitals/me
 * @access  Private
 */
export const getMyHospital = asyncHandler(async (req, res) => {
  const supabase_id = req.user.id;

  try {
    const hospital = await prisma.hospital.findUnique({
      where: { supabase_id },
      include: {
        doctors: true,
      },
    });

    if (!hospital) {
      throw new ApiError(404, "Hospital not found for this user");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          hospital,
          "Hospital details retrieved successfully",
        ),
      );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Error fetching hospital details", [error.message]);
  }
});

/**
 * @desc    Add a doctor to the hospital
 * @route   POST /api/hospitals/doctors
 * @access  Private
 */
export const addDoctor = asyncHandler(async (req, res) => {
  const { name, email, specialty, phone } = req.body;
  const supabase_id = req.user.id;

  if (!name || !email) {
    throw new ApiError(400, "Doctor name and email are required");
  }

  try {
    const hospital = await prisma.hospital.findUnique({
      where: { supabase_id },
    });

    if (!hospital) {
      throw new ApiError(
        404,
        "Hospital not found. Please register your hospital first.",
      );
    }

    const doctor = await prisma.doctor.create({
      data: {
        name,
        email,
        specialty,
        phone,
        hospital_id: hospital.id,
      },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, doctor, "Doctor added successfully"));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Error adding doctor", [error.message]);
  }
});

/**
 * @desc    Get all doctors for the hospital
 * @route   GET /api/hospitals/doctors
 * @access  Private
 */
export const getDoctors = asyncHandler(async (req, res) => {
  const supabase_id = req.user.id;

  try {
    const hospital = await prisma.hospital.findUnique({
      where: { supabase_id },
    });

    if (!hospital) {
      throw new ApiError(404, "Hospital not found");
    }

    const doctors = await prisma.doctor.findMany({
      where: { hospital_id: hospital.id },
      orderBy: { name: "asc" },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, doctors, "Doctors retrieved successfully"));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Error fetching doctors", [error.message]);
  }
});
