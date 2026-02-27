import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const OTP_LENGTH = 6;

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { login } = useAuth();
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const setRef = useCallback(
    (index: number) => (ref: TextInput | null) => {
      inputRefs.current[index] = ref;
    },
    []
  );

  const focusInput = (index: number) => {
    if (index >= 0 && index < OTP_LENGTH) {
      inputRefs.current[index]?.focus();
    }
  };

  const updateDigit = (index: number, value: string) => {
    // Handle paste: if user pastes a full OTP
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
      if (pasted.length > 0) {
        const newDigits = Array(OTP_LENGTH).fill("");
        for (let i = 0; i < pasted.length; i++) {
          newDigits[i] = pasted[i];
        }
        setDigits(newDigits);
        if (pasted.length >= OTP_LENGTH) {
          Keyboard.dismiss();
        } else {
          focusInput(pasted.length);
        }
        return;
      }
    }

    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
      focusInput(index - 1);
    }
  };

  const code = digits.join("");
  const isComplete = code.length === OTP_LENGTH && /^\d{6}$/.test(code);

  const handleVerify = async () => {
    if (!isComplete) return;
    setLoading(true);
    try {
      const data = await api.post<{ token: string; user: any }>(
        "/auth/verify-otp",
        { email, code }
      );
      await login(data.token, data.user);
      router.replace("/(driver)/dashboard");
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Invalid or expired OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post("/auth/request-otp", { email });
      setDigits(Array(OTP_LENGTH).fill(""));
      focusInput(0);
      Alert.alert("OTP Sent", "A new code has been sent to your email.");
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to resend OTP"
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <View className="flex-1 justify-center bg-white px-6">
      <View className="mb-8">
        <Text className="text-2xl font-bold text-gray-900">Enter OTP</Text>
        <Text className="mt-1 text-gray-500">
          Enter the 6-digit code sent to {email}
        </Text>
      </View>

      <View className="mb-6 flex-row justify-between">
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={setRef(index)}
            className="h-14 w-12 rounded-lg border border-gray-300 text-center text-2xl font-bold"
            value={digit}
            onChangeText={(value) => updateDigit(index, value)}
            onKeyPress={({ nativeEvent }) =>
              handleKeyPress(index, nativeEvent.key)
            }
            keyboardType="number-pad"
            maxLength={index === 0 ? OTP_LENGTH : 1}
            selectTextOnFocus
          />
        ))}
      </View>

      <TouchableOpacity
        className={`rounded-lg py-3 ${isComplete ? "bg-blue-600" : "bg-gray-300"}`}
        onPress={handleVerify}
        disabled={loading || !isComplete}
      >
        <Text className="text-center text-base font-semibold text-white">
          {loading ? "Verifying..." : "Verify OTP"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} disabled={resending} className="mt-4">
        <Text className="text-center text-blue-600">
          {resending ? "Sending..." : "Resend OTP"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} className="mt-4">
        <Text className="text-center text-gray-500">Back</Text>
      </TouchableOpacity>
    </View>
  );
}
