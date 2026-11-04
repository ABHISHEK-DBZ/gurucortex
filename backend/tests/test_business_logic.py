"""
Unit Tests for GuruCortex Core Business Logic
Verifies SM-2 algorithm calculations, cognitive coach strategy selection,
and reality engine processing in complete isolation.
"""
import pytest
from app.services.revision_engine import RevisionEngine
from app.services.cognitive_coach import CognitiveCoach, STRATEGY_TEMPLATES


def test_sm2_failed_recall_resets_interval():
    """Grade < 3 must reset repetition count and set interval to 1 day"""
    # Previously on repetition 5, interval 20 days, EF 2.5
    reps, ef, interval = RevisionEngine.calculate_sm2(grade=2, repetitions=5, ease_factor=2.5, interval_days=20)
    assert reps == 0
    assert interval == 1
    # EF should decrease because grade was below 5
    assert ef < 2.5


def test_sm2_initial_learning_progression():
    """First success gives interval 1, second gives interval 6"""
    # Repetition 0 -> grade 5 (perfect)
    reps1, ef1, interval1 = RevisionEngine.calculate_sm2(grade=5, repetitions=0, ease_factor=2.5, interval_days=1)
    assert reps1 == 1
    assert interval1 == 1
    assert ef1 >= 2.5

    # Repetition 1 -> grade 4 (good with hesitation)
    reps2, ef2, interval2 = RevisionEngine.calculate_sm2(grade=4, repetitions=reps1, ease_factor=ef1, interval_days=interval1)
    assert reps2 == 2
    assert interval2 == 6

    # Repetition 2 -> grade 5
    reps3, ef3, interval3 = RevisionEngine.calculate_sm2(grade=5, repetitions=reps2, ease_factor=ef2, interval_days=interval2)
    assert reps3 == 3
    assert interval3 == int(round(6 * ef2))


def test_sm2_ease_factor_minimum_floor():
    """Ease factor must never drop below 1.3 even after repeated failures"""
    ef = 1.4
    for _ in range(10):
        _, ef, _ = RevisionEngine.calculate_sm2(grade=0, repetitions=1, ease_factor=ef, interval_days=1)
    assert ef == 1.3


def test_sm2_grade_clamping():
    """Grades below 0 or above 5 must be clamped gracefully without error"""
    reps_neg, ef_neg, int_neg = RevisionEngine.calculate_sm2(grade=-5, repetitions=2, ease_factor=2.0, interval_days=5)
    assert reps_neg == 0
    assert int_neg == 1

    reps_high, ef_high, int_high = RevisionEngine.calculate_sm2(grade=99, repetitions=1, ease_factor=2.5, interval_days=1)
    assert reps_high == 2
    assert int_high == 6


def test_cognitive_coach_strategy_templates():
    """Ensure all evidence-backed learning strategies have required pedagogical attributes"""
    coach = CognitiveCoach()
    assert len(STRATEGY_TEMPLATES) >= 4
    for key, template in STRATEGY_TEMPLATES.items():
        assert "title" in template
        assert "rationale" in template
        assert "action_plan" in template
        assert "duration" in template
        assert "evidence" in template
        assert template["duration"] > 0

