import { supabase } from "../../supabase";

export default class HouseService {

    static async createHouse(houseData) {

        const { data, error } = await supabase
            .from("homes")
            .insert([
                {
                    userID: houseData.user_id,
                    name: houseData.name,
                    address: houseData.address,
                }
            ])
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }
}