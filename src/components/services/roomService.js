import { supabase } from "../../supabase";

export default class RoomService {

    static async createRoom(roomData) {

        const { data, error } = await supabase
            .from("rooms")
            .insert([
                {
                    home_id: roomData.home_id,
                    room_name: roomData.room_name,
                    room_renter: roomData.room_renter,
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