import doctorModel from "../../models/doctor/doctorModel.js";
import doctorPaymentModel from "../../models/doctor/doctorPayment.js";
import { applyPagination } from "../../utils/applyPagination.js";



//API endPoint to get all payments details 
const getDocPayments = async (req, res) => {
    try {
        const { docId, cursor } = req.query;

        const doctor = await doctorModel.findById(docId)

        if (!doctor) {
            return res.json({
                success: false,
                message: "Doctor profile, not found"
            })
        }

        let query = { doctorId: docId, status: { $ne: "created" } };

        //Apply pagination
        const limit = 6;
        const { results, hasNextPage, nextCursor } = await applyPagination(query, doctorPaymentModel, limit, cursor);


        if (results.length === 0) {
            return res.json({
                success: false,
                message: "No payment details found!"
            })
        }

        res.json({
            success: true,
            payments: results,
            hasNextPage,
            nextCursor
        })
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        })
    }
}



export { getDocPayments };