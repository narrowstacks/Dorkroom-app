import React from "react";
import { Platform, StyleSheet } from "react-native";
import {
  Textarea,
  TextareaInput,
  Button,
  ButtonText,
  Box,
  Text,
} from "@gluestack-ui/themed";
import { useReciprocityCalculator } from "@/hooks/useReciprocityCalculator";
import { FILM_TYPES, EXPOSURE_PRESETS } from "@/constants/reciprocity";
import { useThemeColor } from "@/hooks/useThemeColor";
import { fonts } from "@/styles/common";
import { CalculatorLayout } from "@/components/ui/layout/CalculatorLayout";
import { ResultRow } from "@/components/ui/calculator/ResultsSection";
import { InfoSection, InfoText } from "@/components/ui/calculator/InfoSection";
import { StyledSelect } from "@/components/ui/select/StyledSelect";

export default function ReciprocityCalculator() {
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "borderColor");
  const tintColor = useThemeColor({}, "tint");
  const inputBackground = useThemeColor({}, "inputBackground");
  const textSecondary = useThemeColor({}, "textSecondary");
  const textMuted = useThemeColor({}, "textMuted");
  const errorColor = useThemeColor({}, "errorColor");
  const surfaceVariant = useThemeColor({}, "surfaceVariant");

  const {
    filmType,
    setFilmType,
    meteredTime,
    setMeteredTime,
    customFactor,
    setCustomFactor,
    formattedTime,
    timeFormatError,
    calculation,
    formatTime,
  } = useReciprocityCalculator();

  const infoSection = (
    <InfoSection title="What is reciprocity failure?">
      <InfoText>
        Film becomes less sensitive to light during long exposures, requiring
        additional exposure time beyond what your light meter indicates.
        Different films have different characteristics, represented by the
        reciprocity factor.
      </InfoText>
    </InfoSection>
  );

  return (
    <CalculatorLayout title="Reciprocity Calculator" infoSection={infoSection}>
      {/* Unified Calculator Section */}
      <Box
        className="w-full max-w-2xl rounded-2xl p-6"
        style={[
          styles.unifiedContainer,
          {
            backgroundColor: surfaceVariant,
            borderColor,
          },
        ]}
      >
        {/* Input Section */}
        <Box className="w-full gap-6" style={styles.inputSection}>
          {/* Film Type */}
          <Box className="w-full gap-2">
            <Text
              className="text-base font-medium"
              style={[styles.inputLabel, { color: textColor }]}
            >
              Film Type
            </Text>
            <StyledSelect
              value={filmType}
              onValueChange={setFilmType}
              items={FILM_TYPES}
            />
          </Box>

          {/* Custom Factor (conditional) */}
          {filmType === "custom" && (
            <Box className="w-full gap-2">
              <Text
                className="text-base font-medium"
                style={[styles.inputLabel, { color: textColor }]}
              >
                Reciprocity Factor
              </Text>
              <Textarea
                className={`w-full rounded-xl border`}
                style={{
                  backgroundColor: inputBackground,
                  borderColor,
                  height: 48,
                }}
              >
                <TextareaInput
                  value={customFactor}
                  onChangeText={setCustomFactor}
                  keyboardType={
                    Platform.OS === "ios" ? "decimal-pad" : "numeric"
                  }
                  placeholder="1.3"
                  placeholderTextColor={textMuted}
                  multiline={false}
                  className={`px-4 py-3 text-base`}
                  style={{ color: textColor }}
                />
              </Textarea>
              <Text
                className="text-xs italic"
                style={[styles.infoText, { color: textMuted }]}
              >
                Higher values mean more compensation needed
              </Text>
            </Box>
          )}

          {/* Metered Time */}
          <Box className="w-full gap-2">
            <Text
              className="text-base font-medium"
              style={[styles.inputLabel, { color: textColor }]}
            >
              Metered Exposure Time
            </Text>
            <Textarea
              className={`w-full rounded-xl border`}
              style={{
                backgroundColor: inputBackground,
                borderColor: timeFormatError ? errorColor : borderColor,
                height: 48,
              }}
            >
              <TextareaInput
                value={meteredTime}
                onChangeText={setMeteredTime}
                placeholder="e.g. 30s, 1m30s, 2h"
                placeholderTextColor={textMuted}
                multiline={false}
                className={`px-4 py-3 text-base`}
                style={{ color: textColor }}
              />
            </Textarea>
            {formattedTime && (
              <Text
                className="text-xs italic"
                style={[styles.helpText, { color: textMuted }]}
              >
                Parsed as: {formattedTime}
              </Text>
            )}
            {timeFormatError && (
              <Text
                className="text-xs font-medium"
                style={[styles.errorText, { color: errorColor }]}
              >
                {timeFormatError}
              </Text>
            )}
          </Box>

          {/* Preset Buttons */}
          <Box className="w-full gap-2">
            <Text
              className="text-base font-medium"
              style={[styles.inputLabel, { color: textColor }]}
            >
              Common Presets
            </Text>
            <Box
              className="flex-row flex-wrap gap-3"
              style={styles.presetsContainer}
            >
              {EXPOSURE_PRESETS.map((seconds: number) => (
                <Button
                  key={seconds}
                  variant="outline"
                  action="default"
                  size="sm"
                  className={`min-w-20 rounded-xl border`}
                  style={{
                    borderColor,
                    backgroundColor: inputBackground,
                  }}
                  onPress={() => setMeteredTime(seconds.toString() + "s")}
                >
                  <ButtonText
                    className={`text-sm font-medium`}
                    style={{ color: textColor }}
                  >
                    {formatTime(seconds)}
                  </ButtonText>
                </Button>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Results Section (conditional) */}
        {calculation && (
          <>
            {/* Divider */}
            <Box
              className="my-6 h-px w-full"
              style={[styles.divider, { backgroundColor: `${borderColor}40` }]}
            />

            {/* Results */}
            <Box className="w-full gap-4" style={styles.resultsSection}>
              <Text
                className="text-lg font-semibold"
                style={[styles.resultsTitle, { color: textColor }]}
              >
                Calculation Results
              </Text>

              <ResultRow
                label="Increase"
                value={`${Math.round(calculation.percentageIncrease)}%`}
              />
              <ResultRow
                label="Formula"
                value={
                  <Text style={[styles.formulaContainer, { color: textColor }]}>
                    <Text style={styles.formulaBase}>
                      {calculation.originalTime}
                    </Text>
                    <Text
                      style={[styles.formulaExponent, { color: tintColor }]}
                    >
                      {calculation.factor.toFixed(2)}
                    </Text>
                    <Text style={styles.formulaBase}>{" = "}</Text>
                    <Text style={styles.formulaResult}>
                      {Math.round(calculation.adjustedTime * 10) / 10}
                    </Text>
                  </Text>
                }
              />
              <ResultRow
                label="Adjusted Time"
                value={formatTime(calculation.adjustedTime)}
                isLast
              />

              {/* Visual Time Comparison */}
              <Box
                className="mt-4 w-full gap-3"
                style={styles.timeComparisonContainer}
              >
                <Text
                  className="mb-2 text-center text-base font-semibold"
                  style={styles.timeComparisonTitle}
                >
                  Time Comparison
                </Text>
                <Box
                  className="relative h-5 w-full overflow-hidden rounded-lg"
                  style={[
                    styles.timeBarContainer,
                    { backgroundColor: `${textSecondary}20` },
                  ]}
                >
                  <Box
                    className="w-3/10 absolute left-0 top-0 z-10 h-full rounded-lg"
                    style={[
                      styles.timeBar,
                      styles.meteredTimeBar,
                      { backgroundColor: tintColor },
                    ]}
                  />
                  <Box
                    className="absolute left-0 top-0 z-20 h-full rounded-lg"
                    style={[
                      styles.timeBar,
                      styles.adjustedTimeBar,
                      {
                        backgroundColor: `${tintColor}66`,
                        width: `${Math.min(
                          (calculation.adjustedTime /
                            calculation.originalTime) *
                            100,
                          100,
                        )}%`,
                      },
                    ]}
                  />
                </Box>
                <Box
                  className="mt-2 w-full flex-row justify-between"
                  style={styles.timeBarLabels}
                >
                  <Text
                    className="text-xs"
                    style={[styles.timeBarLabel, { color: textSecondary }]}
                  >
                    Metered: {formatTime(calculation.originalTime)}
                  </Text>
                  <Text
                    className="text-xs"
                    style={[styles.timeBarLabel, { color: textSecondary }]}
                  >
                    Adjusted: {formatTime(calculation.adjustedTime)}
                  </Text>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </CalculatorLayout>
  );
}

const styles = StyleSheet.create({
  unifiedContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 672, // max-w-2xl equivalent (42rem * 16px)
  },
  inputSection: {
    gap: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  divider: {
    height: 1,
    width: "100%",
    marginVertical: 24,
  },
  resultsSection: {
    gap: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  formulaContainer: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 22,
    fontFamily: Platform.select({
      ios: fonts.ios.primary,
      android: fonts.android.primary,
      web: fonts.web.primary,
    }),
  },
  formulaBase: {
    fontSize: 18,
    fontWeight: "600",
  },
  formulaExponent: {
    fontSize: 11,
    fontWeight: "700",
    textAlignVertical: "top",
    lineHeight: 11,
    ...Platform.select({
      ios: {
        textAlignVertical: "top",
        transform: [{ translateY: -6 }],
      },
      android: {
        textAlignVertical: "top",
        includeFontPadding: false,
      },
      web: {
        verticalAlign: "super",
        fontSize: 11,
      },
    }),
  },
  formulaResult: {
    fontSize: 18,
    fontWeight: "700",
  },
  presetsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  helpText: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
  },
  infoText: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 6,
  },
  timeComparisonContainer: {
    width: "100%",
    marginTop: 16,
    gap: 12,
  },
  timeComparisonTitle: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "600",
    textAlign: "center",
  },
  timeBarContainer: {
    width: "100%",
    height: 20,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  timeBar: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    borderRadius: 10,
  },
  meteredTimeBar: {
    width: "30%",
    zIndex: 1,
  },
  adjustedTimeBar: {
    zIndex: 2,
  },
  timeBarLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
  },
  timeBarLabel: {
    fontSize: 12,
  },
});
