using SharpAstrology.Enums;
using SharpAstrology.Interfaces;
using SharpAstrology.HumanDesign.Mathematics;
using SharpAstrology.Utility;

namespace SharpAstrology.ExtensionMethods;

public static class HumanDesignPlanetPositionProviderExtensionMethods
{
    private const float DesignDegDistance = 88;
    /// <summary>
    /// Calculates the design Julian day for a given birthdate using the provided planet position provider.
    /// The design Julian day is determined by finding the day when the Sun's position is 88 degrees ahead of the birthdate's Sun position.
    /// </summary>
    /// <param name="planetPositionProvider">The planet position provider used for planetary positions calculations.</param>
    /// <param name="birthdate">The UTC date of birth for which the design Julian day is being calculated.</param>
    /// <returns>The design Julian day corresponding to the given birthdate.</returns>
    /// <exception cref="ArgumentException">Thrown if the provided birthdate is not in UTC.</exception>
    public static DateTime DesignJulianDay(this IPlanetPositionProvider planetPositionProvider, DateTime birthdate)
    {
        if (birthdate.Kind != DateTimeKind.Utc)
        {
            throw new ArgumentException("The given birthdate is not in UTC");
        }
        var dateOfBirthJulian = birthdate.ToJulianDate();
        var sunsLongitude = planetPositionProvider.PlanetsPosition(Planets.Sun, birthdate).Longitude;
        var dateOfIncomingJulian = RootFinder.FindRoot(jd => AstrologyUtility.AngleDifference(
            AstrologyUtility.SubtractDegree(sunsLongitude, DesignDegDistance),
            planetPositionProvider.PlanetsPosition(Planets.Sun, AstrologyUtility.DateTimeFromJulianDate(jd)).Longitude
        ), dateOfBirthJulian - 110, dateOfBirthJulian - 70, maxIterations: 1000);

        return AstrologyUtility.DateTimeFromJulianDate(dateOfIncomingJulian);
    }
}
